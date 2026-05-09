export type CreateVerificationRequestBody = {
  id_image_url: string;
  license_url: string;
  vehicle_type: string;
  plate_number: string;
};

export type ReviewVerificationRequestBody = {
  status: "APPROVED" | "REJECTED";
  rejection_reason?: string;
};
