import { HttpError } from "../../core/exception/http-error.js";
import { usersRepository } from "./users.repository.js";
import { ridesRepository } from "../rides/rides.repository.js";

const ALLOWED_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png"]);
const PHOTO_METADATA_KEY = "profile_photo_blob_v1";

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

const hasActiveRides = async (userId: string) => {
  const response = await ridesRepository.countActiveRidesForUser(userId);
  const { count, error } = response as { count: number | null; error: { message: string } | null };
  if (error) throw new HttpError(500, error.message);
  return (count ?? 0) > 0;
};

export const usersService = {
  async listUsers() {
    const { data, error } = await usersRepository.listUsers();
    if (error) throw new HttpError(500, error.message);
    return data;
  },

  async getUserById(userId: string) {
    const { data, error } = await usersRepository.getUserById(userId);
    if (error) throw new HttpError(404, "User not found");
    return data;
  },

  async getUserPhoto(targetUserId: string) {
    const { data, error } = await usersRepository.getUserPhotoById(targetUserId);

    if (error) {
      if (!isMissingPhotoColumnsError(error.message)) {
        throw new HttpError(500, error.message);
      }

      const { data: authData, error: authError } = await usersRepository.getAuthUserById(targetUserId);
      if (authError) throw new HttpError(500, authError.message);

      const metadataBlob = authData.user?.user_metadata?.[PHOTO_METADATA_KEY];
      if (typeof metadataBlob !== "string") throw new HttpError(404, "No profile photo found");

      const parsed = parseMetadataPhotoBlob(metadataBlob);
      if (!parsed) throw new HttpError(404, "No profile photo found");

      const metadataUpdatedAt = authData.user?.user_metadata?.profile_photo_updated_at;
      return {
        success: true,
        fileReference: `${targetUserId}/${String(metadataUpdatedAt ?? "metadata")}`,
        mimeType: parsed.mimeType,
        fileName: parsed.fileName,
        fileDataBase64: parsed.fileDataBase64,
      };
    }

    if (!data?.profile_photo) throw new HttpError(404, "No profile photo found");

    const fileDataBase64 = parseByteaToBase64(data.profile_photo);
    const updatedAt = data.profile_photo_updated_at ?? new Date().toISOString();

    return {
      success: true,
      fileReference: `${targetUserId}/${updatedAt}`,
      mimeType: data.profile_photo_mime,
      fileName: data.profile_photo_name,
      fileDataBase64,
    };
  },

  async uploadUserPhoto(targetUserId: string, fileName?: string, mimeType?: string, fileDataBase64?: string) {
    if (!fileName || !mimeType || !fileDataBase64) {
      throw new HttpError(400, "fileName, mimeType, and fileDataBase64 are required");
    }

    if (!isAllowedImageFile(mimeType, fileName)) {
      throw new HttpError(400, "Only .jpg, .jpeg, and .png files are allowed");
    }

    let bytes: Buffer;
    try {
      bytes = Buffer.from(fileDataBase64, "base64");
    } catch {
      throw new HttpError(400, "Invalid base64 file payload");
    }

    if (!bytes.length) throw new HttpError(400, "Empty image payload");
    if (bytes.length > 5 * 1024 * 1024) throw new HttpError(413, "Image too large. Max size is 5MB");

    const byteaHex = `\\x${bytes.toString("hex")}`;
    const uploadedAt = new Date().toISOString();

    const { error } = await usersRepository.updateUserPhotoById(targetUserId, {
      profile_photo: byteaHex,
      profile_photo_mime: mimeType,
      profile_photo_name: fileName,
      profile_photo_updated_at: uploadedAt,
      updated_at: uploadedAt,
    });

    if (error) {
      if (!isMissingPhotoColumnsError(error.message)) {
        throw new HttpError(500, error.message);
      }

      const { data: authData, error: authError } = await usersRepository.getAuthUserById(targetUserId);
      if (authError) throw new HttpError(500, authError.message);

      const updatedMetadata = {
        ...(authData.user?.user_metadata ?? {}),
        [PHOTO_METADATA_KEY]: buildMetadataPhotoBlob(mimeType, fileName, fileDataBase64),
        profile_photo_updated_at: uploadedAt,
      };

      const { error: metadataError } = await usersRepository.updateAuthUserMetadata(targetUserId, updatedMetadata);
      if (metadataError) throw new HttpError(500, metadataError.message);
    }

    return {
      success: true,
      message: "Profile photo uploaded successfully",
      fileReference: `${targetUserId}/${uploadedAt}`,
    };
  },

  async deleteUserPhoto(targetUserId: string) {
    const updatedAt = new Date().toISOString();
    const { error } = await usersRepository.clearUserPhotoById(targetUserId, updatedAt);

    if (error) {
      if (!isMissingPhotoColumnsError(error.message)) {
        throw new HttpError(500, error.message);
      }

      const { data: authData, error: authError } = await usersRepository.getAuthUserById(targetUserId);
      if (authError) throw new HttpError(500, authError.message);

      const updatedMetadata = {
        ...(authData.user?.user_metadata ?? {}),
        [PHOTO_METADATA_KEY]: null,
        profile_photo_updated_at: null,
      };

      const { error: metadataError } = await usersRepository.updateAuthUserMetadata(targetUserId, updatedMetadata);
      if (metadataError) throw new HttpError(500, metadataError.message);
    }

    return { success: true, message: "Profile photo removed successfully" };
  },

  async updateUserStatus(userId: string, status: "ACTIVE" | "SUSPENDED") {
    if (!["ACTIVE", "SUSPENDED"].includes(status)) {
      throw new HttpError(400, "Status must be ACTIVE or SUSPENDED");
    }

    const { data, error } = await usersRepository.updateUserStatusById(userId, status);
    if (error) throw new HttpError(500, error.message);
    return data;
  },

  async suspendUser(userId: string, reason: string, durationHours?: number) {
    const { data: target, error: roleErr } = await usersRepository.getUserById(userId);
    if (roleErr || !target) throw new HttpError(404, "User not found");
    if ((String((target as any).role ?? "")).toUpperCase() === "ADMIN") {
      throw new HttpError(400, "Cannot suspend an admin user");
    }
    if (await hasActiveRides(userId)) {
      throw new HttpError(400, "Cannot suspend a user with active rides");
    }
    let suspendedUntil: string | null = null;
    if (typeof durationHours === "number" && Number.isFinite(durationHours) && durationHours > 0) {
      suspendedUntil = new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString();
    }
    const { data, error } = await usersRepository.suspendUserById(userId, reason, suspendedUntil);
    if (error) throw new HttpError(500, error.message);
    return data;
  },

  async reactivateUser(userId: string) {
    const { data, error } = await usersRepository.reactivateUserById(userId);
    if (error) throw new HttpError(500, error.message);
    return data;
  },

  async setUserRole(requestingUserId: string, userId: string, role: "RIDER" | "DRIVER" | "BOTH" | "ADMIN") {
    if (requestingUserId === userId) {
      throw new HttpError(403, "You cannot change your own role");
    }

    const { data: target, error: targetErr } = await usersRepository.getUserById(userId);
    if (targetErr || !target) throw new HttpError(404, "User not found");

    const normalized = role.toUpperCase();
    if (!["RIDER", "DRIVER", "BOTH", "ADMIN"].includes(normalized)) {
      throw new HttpError(400, "Invalid role");
    }

    const previousRoles = [String((target as any).role ?? "").toUpperCase()].filter(Boolean);

    if (await hasActiveRides(userId) && normalized !== "ADMIN") {
      throw new HttpError(400, "Cannot change the role of a user with active rides");
    }

    // Prevent demoting the last admin
    if (normalized !== "ADMIN") {
      const { data: allUsers, error: listErr } = await usersRepository.listUsers();
      if (!listErr && allUsers) {
        const admins = allUsers.filter((u: any) => (u.role ?? "").toUpperCase() === "ADMIN");
        if ((target.role ?? "").toUpperCase() === "ADMIN" && admins.length <= 1) {
          throw new HttpError(400, "Cannot demote the last admin");
        }
      }
    }

    const dbRole = normalized.toLowerCase();
    const payload: Record<string, unknown> = { role: dbRole };

    const driverCapableRoles = ["DRIVER", "BOTH", "ADMIN"];

    // If admin demotes a user away from driver-capable roles,
    // immediately revoke driver verification so they must re-apply.
    if (!driverCapableRoles.includes(normalized)) {
      payload.driver_verification_status = "REVOKED";
      payload.driver_rejection_reason = "Driver access removed by admin role update.";
      payload.driver_status = "OFFLINE";
    }

    // If admin explicitly grants any driver-capable role, mark verification approved.
    if (driverCapableRoles.includes(normalized)) {
      payload.driver_verification_status = "APPROVED";
      payload.driver_rejection_reason = null;
      payload.driver_verified_at = new Date().toISOString();
    }

    const { data, error } = await usersRepository.setUserRoleById(userId, payload);
    if (error) throw new HttpError(500, error.message);

    // Audit log is best-effort — don't fail the request if the table doesn't exist
    try {
      await usersRepository.insertAdminRoleAudit({
        admin_id: requestingUserId,
        target_user_id: userId,
        previous_roles: previousRoles,
        new_roles: [normalized],
        reason: null,
      });
    } catch (auditErr) {
      console.warn("[setUserRole] audit log skipped:", auditErr);
    }
    return data;
  },

  async deleteUser(userId: string) {
    const { data: target, error: roleErr } = await usersRepository.getUserById(userId);
    if (roleErr || !target) throw new HttpError(404, "User not found");
    if ((String((target as any).role ?? "")).toUpperCase() === "ADMIN") {
      throw new HttpError(400, "Cannot delete an admin user");
    }
    if (await hasActiveRides(userId)) {
      throw new HttpError(400, "Cannot delete a user with active rides");
    }

    // 1. Delete profile row
    const { error: dbError } = await usersRepository.deleteUserById(userId);
    if (dbError) throw new HttpError(500, dbError.message);

    // 2. Delete auth user (soft-delete via disabled)
    const { error: authError } = await usersRepository.disableAuthUserById(userId);
    if (authError) throw new HttpError(500, authError.message);

    return { success: true, message: "User deleted successfully" };
  },

  async revokeDriver(userId: string, reason: string) {
    const { data, error } = await usersRepository.revokeDriverById(userId, reason);
    if (error) throw new HttpError(500, error.message);
    return data;
  },

  async getAccountPendingQueue() {
    const { data, error } = await usersRepository.listAccountPendingUsers();
    if (error) throw new HttpError(500, error.message);
    return data;
  },

  async getAccountProcessedQueue() {
    const { data, error } = await usersRepository.listAccountProcessedUsers();
    if (error) throw new HttpError(500, error.message);
    return data;
  },

  async getDriverPendingQueue() {
    const { data, error } = await usersRepository.listDriverPendingUsers();
    if (error) throw new HttpError(500, error.message);
    return data;
  },

  async getDriverProcessedQueue() {
    const { data, error } = await usersRepository.listDriverProcessedUsers();
    if (error) throw new HttpError(500, error.message);
    return data;
  },

  async approveAccountVerification(userId: string) {
    const { data, error } = await usersRepository.approveAccountVerificationById(userId);
    if (error) throw new HttpError(500, error.message);
    return data;
  },

  async rejectAccountVerification(userId: string, reason?: string) {
    const { data, error } = await usersRepository.rejectAccountVerificationById(userId, reason ?? "");
    if (error) throw new HttpError(500, error.message);
    return data;
  },

  async approveDriverVerification(userId: string) {
    const { data, error } = await usersRepository.approveDriverVerificationById(userId);
    if (error) throw new HttpError(500, error.message);
    return data;
  },

  async rejectDriverVerification(userId: string, reason?: string) {
    const { data, error } = await usersRepository.rejectDriverVerificationById(userId, reason ?? "");
    if (error) throw new HttpError(500, error.message);
    return data;
  },
};
