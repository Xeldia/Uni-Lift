import { HttpError } from "../../../core/exception/http-error.js";
import { sosRepository } from "./sos.repository.js";

export const sosService = {
  async listSosAlerts() {
    const { data, error } = await sosRepository.listSosAlerts();
    if (error) throw new HttpError(500, error.message);
    return data;
  },

  async createSosAlert(payload: {
    user_id: string;
    ride_id: string;
    type: "ALARM" | "SILENT";
    location: string;
    lat: number;
    lng: number;
  }) {
    const { data, error } = await sosRepository.createSosAlert(payload);
    if (error) throw new HttpError(500, error.message);
    return data;
  },

  async resolveSosAlert(alertId: string, resolvedBy: string, resolutionNote?: string) {
    const { data, error } = await sosRepository.resolveSosAlert(alertId, resolvedBy, resolutionNote);
    if (error) throw new HttpError(500, error.message);
    return data;
  },
};
