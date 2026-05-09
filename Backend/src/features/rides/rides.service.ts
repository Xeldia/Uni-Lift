import { HttpError } from "../../core/exception/http-error.js";
import { ridesRepository } from "./rides.repository.js";

export const ridesService = {
  async listRides(userId: string, isAdmin: boolean) {
    const { data, error } = isAdmin
      ? await ridesRepository.listRidesForAdmin()
      : await ridesRepository.listRidesForUser(userId);

    if (error) throw new HttpError(500, error.message);
    return data;
  },

  async getRideById(rideId: string) {
    const { data, error } = await ridesRepository.getRideById(rideId);
    if (error) throw new HttpError(404, "Ride not found");
    return data;
  },

  async createRide(payload: {
    rider_id: string;
    pickup: string;
    dropoff: string;
    scheduled_at: string;
    passenger_count?: number | null;
    fare: number;
  }) {
    const { data, error } = await ridesRepository.createRide(payload);
    if (error) throw new HttpError(500, error.message);
    return data;
  },

  async updateRideStatus(rideId: string, status: string) {
    const { data, error } = await ridesRepository.updateRideStatus(rideId, status);
    if (error) throw new HttpError(500, error.message);
    return data;
  },
};
