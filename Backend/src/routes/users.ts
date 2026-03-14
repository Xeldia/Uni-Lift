import { Router, Request, Response } from "express";
import { supabaseAdmin } from "../lib/supabase.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

const ALLOWED_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png"]);

const normalizeFileExtension = (fileName: string) => {
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex < 0) return "";
  return fileName.slice(dotIndex + 1).toLowerCase();
};

const isAllowedImageFile = (mimeType: string, fileName: string) => {
  const extension = normalizeFileExtension(fileName);
  const extensionAllowed = extension === "jpg" || extension === "jpeg" || extension === "png";
  const mimeAllowed = ALLOWED_IMAGE_MIME_TYPES.has(mimeType.toLowerCase());
  return extensionAllowed && mimeAllowed;
};

const isSelfOrAdmin = (req: Request, userId: string) => {
  const authUser = (req as any).user;
  if (!authUser) return false;
  return authUser.id === userId || authUser.user_metadata?.role === "admin";
};

const parseByteaToBase64 = (bytea: string | null | undefined) => {
  if (!bytea) return null;
  if (bytea.startsWith("\\x")) {
    const hexPayload = bytea.slice(2);
    return Buffer.from(hexPayload, "hex").toString("base64");
  }
  return Buffer.from(bytea).toString("base64");
};

const isMissingPhotoColumnsError = (message: string) =>
  message.includes("profile_photo") && (message.includes("schema cache") || message.includes("does not exist"));

const PHOTO_METADATA_KEY = "profile_photo_blob_v1";

const buildMetadataPhotoBlob = (mimeType: string, fileName: string, fileDataBase64: string) =>
  `${mimeType}::${encodeURIComponent(fileName)}::${fileDataBase64}`;

const parseMetadataPhotoBlob = (blob: string) => {
  const [mimeType, encodedFileName, fileDataBase64] = blob.split("::");
  if (!mimeType || !encodedFileName || !fileDataBase64) return null;
  return {
    mimeType,
    fileName: decodeURIComponent(encodedFileName),
    fileDataBase64,
  };
};

// GET /api/users — admin: list all users
router.get("/", requireAuth, requireAdmin, async (_req: Request, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
});

// GET /api/users/:id — get single user profile
router.get("/:id", requireAuth, async (req: Request, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("id", req.params.id)
    .single();

  if (error) { res.status(404).json({ error: "User not found" }); return; }
  res.json(data);
});

// GET /api/users/:id/photo — get user profile photo bytes
router.get("/:id/photo", requireAuth, async (req: Request, res: Response) => {
  const targetUserId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!isSelfOrAdmin(req, targetUserId)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id, profile_photo, profile_photo_mime, profile_photo_name, profile_photo_updated_at")
    .eq("id", targetUserId)
    .maybeSingle();

  if (error) {
    if (!isMissingPhotoColumnsError(error.message)) {
      res.status(500).json({ error: error.message });
      return;
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(targetUserId);
    if (authError) {
      res.status(500).json({ error: authError.message });
      return;
    }

    const metadataBlob = authData.user?.user_metadata?.[PHOTO_METADATA_KEY];
    if (typeof metadataBlob !== "string") {
      res.status(404).json({ error: "No profile photo found" });
      return;
    }

    const parsed = parseMetadataPhotoBlob(metadataBlob);
    if (!parsed) {
      res.status(404).json({ error: "No profile photo found" });
      return;
    }

    const metadataUpdatedAt = authData.user?.user_metadata?.profile_photo_updated_at;

    res.json({
      success: true,
      fileReference: `${targetUserId}/${String(metadataUpdatedAt ?? "metadata")}`,
      mimeType: parsed.mimeType,
      fileName: parsed.fileName,
      fileDataBase64: parsed.fileDataBase64,
    });
    return;
  }

  if (!data?.profile_photo) {
    res.status(404).json({ error: "No profile photo found" });
    return;
  }

  const fileDataBase64 = parseByteaToBase64(data.profile_photo);
  const updatedAt = data.profile_photo_updated_at ?? new Date().toISOString();

  res.json({
    success: true,
    fileReference: `${targetUserId}/${updatedAt}`,
    mimeType: data.profile_photo_mime,
    fileName: data.profile_photo_name,
    fileDataBase64,
  });
});

type UploadPhotoRequestBody = {
  fileName?: string;
  mimeType?: string;
  fileDataBase64?: string;
};

// POST /api/users/:id/photo — upload and store profile photo bytes
router.post("/:id/photo", requireAuth, async (req: Request, res: Response) => {
  const targetUserId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!isSelfOrAdmin(req, targetUserId)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const { fileName, mimeType, fileDataBase64 } = req.body as UploadPhotoRequestBody;

  if (!fileName || !mimeType || !fileDataBase64) {
    res.status(400).json({ error: "fileName, mimeType, and fileDataBase64 are required" });
    return;
  }

  if (!isAllowedImageFile(mimeType, fileName)) {
    res.status(400).json({ error: "Only .jpg, .jpeg, and .png files are allowed" });
    return;
  }

  let bytes: Buffer;
  try {
    bytes = Buffer.from(fileDataBase64, "base64");
  } catch {
    res.status(400).json({ error: "Invalid base64 file payload" });
    return;
  }

  if (!bytes.length) {
    res.status(400).json({ error: "Empty image payload" });
    return;
  }

  if (bytes.length > 5 * 1024 * 1024) {
    res.status(413).json({ error: "Image too large. Max size is 5MB" });
    return;
  }

  const byteaHex = `\\x${bytes.toString("hex")}`;
  const uploadedAt = new Date().toISOString();

  const { error } = await supabaseAdmin
    .from("users")
    .update({
      profile_photo: byteaHex,
      profile_photo_mime: mimeType,
      profile_photo_name: fileName,
      profile_photo_updated_at: uploadedAt,
      updated_at: uploadedAt,
    })
    .eq("id", targetUserId);

  if (error) {
    if (!isMissingPhotoColumnsError(error.message)) {
      res.status(500).json({ error: error.message });
      return;
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(targetUserId);
    if (authError) {
      res.status(500).json({ error: authError.message });
      return;
    }

    const updatedMetadata = {
      ...(authData.user?.user_metadata ?? {}),
      [PHOTO_METADATA_KEY]: buildMetadataPhotoBlob(mimeType, fileName, fileDataBase64),
      profile_photo_updated_at: uploadedAt,
    };

    const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
      user_metadata: updatedMetadata,
    });

    if (metadataError) {
      res.status(500).json({ error: metadataError.message });
      return;
    }
  }

  res.json({
    success: true,
    message: "Profile photo uploaded successfully",
    fileReference: `${targetUserId}/${uploadedAt}`,
  });
});

// DELETE /api/users/:id/photo — remove user profile photo
router.delete("/:id/photo", requireAuth, async (req: Request, res: Response) => {
  const targetUserId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!isSelfOrAdmin(req, targetUserId)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const updatedAt = new Date().toISOString();

  const { error } = await supabaseAdmin
    .from("users")
    .update({
      profile_photo: null,
      profile_photo_mime: null,
      profile_photo_name: null,
      profile_photo_updated_at: null,
      updated_at: updatedAt,
    })
    .eq("id", targetUserId);

  if (error) {
    if (!isMissingPhotoColumnsError(error.message)) {
      res.status(500).json({ error: error.message });
      return;
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(targetUserId);
    if (authError) {
      res.status(500).json({ error: authError.message });
      return;
    }

    const updatedMetadata = {
      ...(authData.user?.user_metadata ?? {}),
      [PHOTO_METADATA_KEY]: null,
      profile_photo_updated_at: null,
    };

    const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
      user_metadata: updatedMetadata,
    });

    if (metadataError) {
      res.status(500).json({ error: metadataError.message });
      return;
    }
  }

  res.json({
    success: true,
    message: "Profile photo removed successfully",
  });
});

// PATCH /api/users/:id/status — admin: suspend or activate a user
router.patch("/:id/status", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const { status } = req.body as { status: "ACTIVE" | "SUSPENDED" };
  if (!["ACTIVE", "SUSPENDED"].includes(status)) {
    res.status(400).json({ error: "Status must be ACTIVE or SUSPENDED" });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from("users")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", req.params.id)
    .select()
    .single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
});

export default router;
