import { Router } from "express";
import { requireAuth, requireAdmin } from "../../core/security/auth.middleware.js";
import type { AuthenticatedRequest } from "../../core/common/authenticated-request.js";
import { handleControllerError, requireString, sendError, sendSuccess } from "../../core/common/api-response.js";
import { usersService } from "./users.service.js";
import type {
  UploadPhotoRequestBody,
  UpdateUserRoleRequestBody,
  UpdateUserStatusRequestBody,
  SuspendUserRequestBody,
  RevokeDriverRequestBody,
  ReviewDriverVerificationRequestBody,
} from "./users.dto.js";

const router = Router();

const isSelfOrAdmin = (req: AuthenticatedRequest, userId: string) => {
  const authUser = req.user;
  if (!authUser) return false;
  return authUser.id === userId || authUser.user_metadata?.role === "admin";
};

router.get("/", requireAuth, requireAdmin, async (_req, res) => {
  try {
    const data = await usersService.listUsers();
    sendSuccess(res, data);
  } catch (error) {
    handleControllerError(error, res);
  }
});

router.get("/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const targetUserId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = await usersService.getUserById(targetUserId);
    sendSuccess(res, data);
  } catch (error) {
    handleControllerError(error, res);
  }
});

router.get("/:id/photo", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const targetUserId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!isSelfOrAdmin(req, targetUserId)) {
      sendError(res, 403, "Forbidden");
      return;
    }

    const data = await usersService.getUserPhoto(targetUserId);
    sendSuccess(res, data);
  } catch (error) {
    handleControllerError(error, res);
  }
});

router.post("/:id/photo", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const targetUserId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!isSelfOrAdmin(req, targetUserId)) {
      sendError(res, 403, "Forbidden");
      return;
    }

    const { fileName, mimeType, fileDataBase64 } = req.body as UploadPhotoRequestBody;
    requireString(fileName, "fileName");
    requireString(mimeType, "mimeType");
    requireString(fileDataBase64, "fileDataBase64");
    const data = await usersService.uploadUserPhoto(targetUserId, fileName, mimeType, fileDataBase64);
    sendSuccess(res, data);
  } catch (error) {
    handleControllerError(error, res);
  }
});

router.delete("/:id/photo", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const targetUserId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!isSelfOrAdmin(req, targetUserId)) {
      sendError(res, 403, "Forbidden");
      return;
    }

    const data = await usersService.deleteUserPhoto(targetUserId);
    sendSuccess(res, data);
  } catch (error) {
    handleControllerError(error, res);
  }
});

router.patch("/:id/status", requireAuth, requireAdmin, async (req, res) => {
  try {
    const targetUserId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { status } = req.body as UpdateUserStatusRequestBody;
    const normalizedStatus = requireString(status, "status");
    const data = await usersService.updateUserStatus(targetUserId, normalizedStatus as UpdateUserStatusRequestBody["status"]);
    sendSuccess(res, data);
  } catch (error) {
    handleControllerError(error, res);
  }
});

router.patch("/:id/suspend", requireAuth, requireAdmin, async (req, res) => {
  try {
    const targetUserId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { reason, durationHours } = req.body as SuspendUserRequestBody;
    const numericDuration =
      typeof durationHours === "number" && Number.isFinite(durationHours)
        ? durationHours
        : undefined;
    const data = await usersService.suspendUser(targetUserId, (reason ?? "").toString(), numericDuration);
    sendSuccess(res, data);
  } catch (error) {
    handleControllerError(error, res);
  }
});

router.patch("/:id/reactivate", requireAuth, requireAdmin, async (req, res) => {
  try {
    const targetUserId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = await usersService.reactivateUser(targetUserId);
    sendSuccess(res, data);
  } catch (error) {
    handleControllerError(error, res);
  }
});

router.patch("/:id/role", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const targetUserId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { role } = req.body as UpdateUserRoleRequestBody;
    const normalizedRole = requireString(role, "role").toUpperCase() as UpdateUserRoleRequestBody["role"];
    const data = await usersService.setUserRole(req.user!.id, targetUserId, normalizedRole as any);
    sendSuccess(res, data);
  } catch (error) {
    handleControllerError(error, res);
  }
});

router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const targetUserId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = await usersService.deleteUser(targetUserId);
    sendSuccess(res, data);
  } catch (error) {
    handleControllerError(error, res);
  }
});

router.patch("/:id/revoke-driver", requireAuth, requireAdmin, async (req, res) => {
  try {
    const targetUserId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { reason } = req.body as RevokeDriverRequestBody;
    const data = await usersService.revokeDriver(targetUserId, (reason ?? "").toString());
    sendSuccess(res, data);
  } catch (error) {
    handleControllerError(error, res);
  }
});

router.get("/verification/account/pending", requireAuth, requireAdmin, async (_req, res) => {
  try {
    const data = await usersService.getAccountPendingQueue();
    sendSuccess(res, data);
  } catch (error) {
    handleControllerError(error, res);
  }
});

router.get("/verification/account/processed", requireAuth, requireAdmin, async (_req, res) => {
  try {
    const data = await usersService.getAccountProcessedQueue();
    sendSuccess(res, data);
  } catch (error) {
    handleControllerError(error, res);
  }
});

router.get("/verification/driver/pending", requireAuth, requireAdmin, async (_req, res) => {
  try {
    const data = await usersService.getDriverPendingQueue();
    sendSuccess(res, data);
  } catch (error) {
    handleControllerError(error, res);
  }
});

router.get("/verification/driver/processed", requireAuth, requireAdmin, async (_req, res) => {
  try {
    const data = await usersService.getDriverProcessedQueue();
    sendSuccess(res, data);
  } catch (error) {
    handleControllerError(error, res);
  }
});

router.patch("/:id/verification/account/approve", requireAuth, requireAdmin, async (req, res) => {
  try {
    const targetUserId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = await usersService.approveAccountVerification(targetUserId);
    sendSuccess(res, data);
  } catch (error) {
    handleControllerError(error, res);
  }
});

router.patch("/:id/verification/account/reject", requireAuth, requireAdmin, async (req, res) => {
  try {
    const targetUserId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { reason } = req.body as ReviewDriverVerificationRequestBody;
    const data = await usersService.rejectAccountVerification(targetUserId, (reason ?? "").toString());
    sendSuccess(res, data);
  } catch (error) {
    handleControllerError(error, res);
  }
});

router.patch("/:id/verification/driver/approve", requireAuth, requireAdmin, async (req, res) => {
  try {
    const targetUserId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = await usersService.approveDriverVerification(targetUserId);
    sendSuccess(res, data);
  } catch (error) {
    handleControllerError(error, res);
  }
});

router.patch("/:id/verification/driver/reject", requireAuth, requireAdmin, async (req, res) => {
  try {
    const targetUserId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { reason } = req.body as ReviewDriverVerificationRequestBody;
    const data = await usersService.rejectDriverVerification(targetUserId, (reason ?? "").toString());
    sendSuccess(res, data);
  } catch (error) {
    handleControllerError(error, res);
  }
});

export default router;
