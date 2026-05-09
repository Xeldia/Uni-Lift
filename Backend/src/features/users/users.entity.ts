export type UserRecord = {
  id: string;
  email: string;
  full_name: string;
  student_id: string;
  status: "ACTIVE" | "SUSPENDED";
  created_at: string;
  updated_at: string;
};

export type UserPhotoRecord = {
  id: string;
  profile_photo: string | null;
  profile_photo_mime: string | null;
  profile_photo_name: string | null;
  profile_photo_updated_at: string | null;
};
