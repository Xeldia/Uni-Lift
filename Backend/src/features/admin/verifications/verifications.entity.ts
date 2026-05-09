export type VerificationStatus = "PENDING" | "APPROVED" | "REJECTED";

export type VerificationRecord = {
  id: string;
  user_id: string;
  id_image_url: string;
  license_url: string;
  vehicle_type: string;
  plate_number: string;
  status: VerificationStatus;
  rejection_reason: string | null;
  submitted_at: string;
  reviewed_at: string | null;
};
