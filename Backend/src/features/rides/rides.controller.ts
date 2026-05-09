import { Router } from "express";
import { requireAuth } from "../../core/security/auth.middleware.js";
import type { AuthenticatedRequest } from "../../core/common/authenticated-request.js";
import { requireString, sendSuccess, handleControllerError } from "../../core/common/api-response.js";
import { ridesService } from "./rides.service.js";
import type { CreateRideRequestBody, UpdateRideStatusRequestBody } from "./rides.dto.js";

const router = Router();

router.get("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user as any;
    const isAdmin = user.user_metadata?.role === "admin";
    const data = await ridesService.listRides(user.id, isAdmin);
    sendSuccess(res, data);
  } catch (error) {
    handleControllerError(error, res);
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const rideId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = await ridesService.getRideById(rideId);
    sendSuccess(res, data);
  } catch (error) {
    handleControllerError(error, res);
  }
});

router.post("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user as any;
    const { pickup, dropoff, scheduled_at, passenger_count, fare } = req.body as CreateRideRequestBody;
    const validatedPickup = requireString(pickup, "pickup");
    const validatedDropoff = requireString(dropoff, "dropoff");

    const data = await ridesService.createRide({
      rider_id: user.id,
      pickup: validatedPickup,
      dropoff: validatedDropoff,
      scheduled_at,
      passenger_count: typeof passenger_count === "number" ? passenger_count : null,
      fare,
    });

    sendSuccess(res, data, 201);
  } catch (error) {
    handleControllerError(error, res);
  }
});

router.patch("/:id/status", requireAuth, async (req, res) => {
  try {
    const rideId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { status } = req.body as UpdateRideStatusRequestBody;
    const normalizedStatus = requireString(status, "status");
    const data = await ridesService.updateRideStatus(rideId, normalizedStatus as UpdateRideStatusRequestBody["status"]);
    sendSuccess(res, data);
  } catch (error) {
    handleControllerError(error, res);
  }
});

export default router;
