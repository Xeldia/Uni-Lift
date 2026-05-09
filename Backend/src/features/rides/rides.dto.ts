export type CreateRideRequestBody = {
  pickup: string;
  dropoff: string;
  scheduled_at: string;
  passenger_count?: number;
  fare: number;
};

export type UpdateRideStatusRequestBody = {
  status: string;
};
