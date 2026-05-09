export type RideStatus = "SEARCHING" | "MATCHED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export type RideRecord = {
  id: string;
  rider_id: string;
  driver_id: string | null;
  pickup: string;
  dropoff: string;
  scheduled_at: string;
  passenger_count: number | null;
  fare: number;
  status: RideStatus;
  created_at: string;
  updated_at: string | null;
};
