export type CreateSosRequestBody = {
  ride_id: string;
  type: "ALARM" | "SILENT";
  location: string;
  lat: number;
  lng: number;
};

export type ResolveSosRequestBody = {
  resolution_note?: string;
};
