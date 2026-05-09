export type UploadPhotoRequestBody = {
  fileName?: string;
  mimeType?: string;
  fileDataBase64?: string;
};

export type UpdateUserStatusRequestBody = {
  status: "ACTIVE" | "SUSPENDED";
};

export type SuspendUserRequestBody = {
  reason?: string;
  durationHours?: number;
};

export type UpdateUserRoleRequestBody = {
  role?: "RIDER" | "DRIVER" | "BOTH" | "ADMIN";
};

export type RevokeDriverRequestBody = {
  reason?: string;
};

export type ReviewDriverVerificationRequestBody = {
  reason?: string;
};
