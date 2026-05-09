import { Router } from "express";
import { requireAuth, requireAdmin } from "../../../core/security/auth.middleware.js";
import type { AuthenticatedRequest } from "../../../core/common/authenticated-request.js";
import { handleControllerError, requireString, sendSuccess } from "../../../core/common/api-response.js";
import { sosService } from "./sos.service.js";
import type { CreateSosRequestBody, ResolveSosRequestBody } from "./sos.dto.js";

const router = Router();

router.get("/", requireAuth, requireAdmin, async (_req, res) => {
  try {
    const data = await sosService.listSosAlerts();
    sendSuccess(res, data);
  } catch (error) {
    handleControllerError(error, res);
  }
});

router.post("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user as any;
    const { ride_id, type, location, lat, lng } = req.body as CreateSosRequestBody;
    const normalizedType = requireString(type, "type");

    const data = await sosService.createSosAlert({
      user_id: user.id,
      ride_id,
      type: normalizedType as CreateSosRequestBody["type"],
      location,
      lat,
      lng,
    });

    sendSuccess(res, data, 201);
  } catch (error) {
    handleControllerError(error, res);
  }
});

router.patch("/:id/resolve", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const alertId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { resolution_note } = req.body as ResolveSosRequestBody;
    const resolvedBy = (req.user as any).email;
    const note = requireString(resolution_note ?? "", "resolution_note", { allowEmpty: false });

    const data = await sosService.resolveSosAlert(alertId, resolvedBy, note);
    sendSuccess(res, data);
  } catch (error) {
    handleControllerError(error, res);
  }
});

export default router;
