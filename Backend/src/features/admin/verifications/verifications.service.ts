import { HttpError } from "../../../core/exception/http-error.js";
import { verificationsRepository } from "./verifications.repository.js";

export const verificationsService = {
  async listVerifications() {
    const { data, error } = await verificationsRepository.listVerifications();
    if (error) throw new HttpError(500, error.message);
    return data;
  },

  async createVerification(payload: {
    user_id: string;
    id_image_url: string;
    license_url: string;
    vehicle_type: string;
    plate_number: string;
  }) {
    const { data, error } = await verificationsRepository.createVerification(payload);
    if (error) throw new HttpError(500, error.message);
    return data;
  },

  async reviewVerification(verificationId: string, status: "APPROVED" | "REJECTED", rejectionReason?: string) {
    if (!["APPROVED", "REJECTED"].includes(status)) {
      throw new HttpError(400, "Status must be APPROVED or REJECTED");
    }

    const { data, error } = await verificationsRepository.reviewVerification(verificationId, status, rejectionReason);
    if (error) throw new HttpError(500, error.message);
    return data;
  },
};
