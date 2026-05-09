import { Router } from "express";
import { requireAuth, requireAdmin } from "../../../core/security/auth.middleware.js";
import type { AuthenticatedRequest } from "../../../core/common/authenticated-request.js";
import { handleControllerError, requireString, sendSuccess } from "../../../core/common/api-response.js";
import { verificationsService } from "./verifications.service.js";
import type { CreateVerificationRequestBody, ReviewVerificationRequestBody } from "./verifications.dto.js";

const router = Router();

router.get("/", requireAuth, requireAdmin, async (_req, res) => {
  try {
    const data = await verificationsService.listVerifications();
    sendSuccess(res, data);
  } catch (error) {
    handleControllerError(error, res);
  }
});

router.post("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user as any;
    const { id_image_url, license_url, vehicle_type, plate_number } = req.body as CreateVerificationRequestBody;
    const validatedImage = requireString(id_image_url, "id_image_url");
    const validatedLicense = requireString(license_url, "license_url");
    const validatedVehicleType = requireString(vehicle_type, "vehicle_type");
    const validatedPlate = requireString(plate_number, "plate_number");

    const data = await verificationsService.createVerification({
      user_id: user.id,
      id_image_url: validatedImage,
      license_url: validatedLicense,
      vehicle_type: validatedVehicleType,
      plate_number: validatedPlate,
    });

    sendSuccess(res, data, 201);
  } catch (error) {
    handleControllerError(error, res);
  }
});

router.patch("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const verificationId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { status, rejection_reason } = req.body as ReviewVerificationRequestBody;
    const normalizedStatus = requireString(status, "status");
    const data = await verificationsService.reviewVerification(verificationId, normalizedStatus as ReviewVerificationRequestBody["status"], rejection_reason);
    sendSuccess(res, data);
  } catch (error) {
    handleControllerError(error, res);
  }
});

export default router;
