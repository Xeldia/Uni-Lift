import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase env vars. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

type UserProfileWriteInput = {
  id: string;
  email: string;
  full_name: string;
  student_id: string;
  phone_number?: string | null;
  university?: string;
  role?: string;
  vehicle?: string | null;
  vehicle_type?: string | null;
};

export async function saveUserProfile(input: UserProfileWriteInput) {
  const {
    id,
    email,
    full_name,
    student_id,
    phone_number = null,
    university = "CIT-U",
    role,
    vehicle,
    vehicle_type,
  } = input;

  const payload: Record<string, unknown> = {
    email,
    full_name,
    student_id,
    phone_number,
    university,
  };

  if (role) {
    payload.role = role;
  }

  if (vehicle !== undefined) {
    payload.vehicle = vehicle;
  }

  if (vehicle_type !== undefined) {
    payload.vehicle_type = vehicle_type;
  }

  const { data: updatedRow, error: updateError } = await supabase
    .from("users")
    .update(payload)
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (updateError) {
    throw updateError;
  }

  if (!updatedRow) {
    const { error: insertError } = await supabase
      .from("users")
      .insert({ id, ...payload });

    if (insertError) {
      throw insertError;
    }
  }
}

async function ensureProfileRow(user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> | null }) {
  const metadata = user.user_metadata ?? {};
  const fullName = typeof metadata.full_name === "string" && metadata.full_name.trim().length > 0
    ? metadata.full_name.trim()
    : (user.email?.split("@")[0] ?? "Unknown");
  const studentId = typeof metadata.student_id === "string" && metadata.student_id.trim().length > 0
    ? metadata.student_id.trim()
    : `TEMP-${user.id.slice(0, 8)}`;
  const phoneNumber = typeof metadata.phone_number === "string" ? metadata.phone_number : null;
  const university = typeof metadata.university === "string" && metadata.university.trim().length > 0
    ? metadata.university.trim()
    : "CIT-U";

  try {
    await saveUserProfile({
      id: user.id,
      email: user.email ?? "",
      full_name: fullName,
      student_id: studentId,
      phone_number: phoneNumber,
      university,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown profile sync error";
    console.warn("users profile sync failed during auth:", errorMessage);
  }
}

// ─── Auth helpers ──────────────────────────────────────────────────────────────

const EPHEMERAL_KEY = "uni-lift-ephemeral";

export async function signIn(email: string, password: string, stayActive = true) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (!error && data?.user) {
    let profile: {
      account_status?: string | null;
      suspend_reason?: string | null;
      suspended_until?: string | null;
    } | null = null;

    const profileWithSuspension = await supabase
      .from("users")
      .select("account_status, suspend_reason, suspended_until")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profileWithSuspension.error) {
      // Backward-compatible fallback: old DBs may not have suspended_until yet.
      const fallback = await supabase
        .from("users")
        .select("account_status, suspend_reason")
        .eq("id", data.user.id)
        .maybeSingle();
      profile = (fallback.data as any) ?? null;
    } else {
      profile = (profileWithSuspension.data as any) ?? null;
    }

    const status = (profile?.account_status ?? "ACTIVE").toString().toUpperCase();
    const suspendedUntilIso = profile?.suspended_until ?? null;
    const suspendedUntilMs = suspendedUntilIso ? Date.parse(suspendedUntilIso) : Number.NaN;
    const nowMs = Date.now();
    const suspensionExpired = Number.isFinite(suspendedUntilMs) && suspendedUntilMs <= nowMs;

    // Auto-clear expired timed suspension so user can sign in again.
    if (status === "SUSPENDED" && suspensionExpired) {
      await supabase
        .from("users")
        .update({
          account_status: "ACTIVE",
          suspend_reason: null,
          suspended_at: null,
          suspended_until: null,
        })
        .eq("id", data.user.id);
    } else if (status === "SUSPENDED") {
      await supabase.auth.signOut();
      return {
        data: null,
        error: {
          message: profile?.suspend_reason
            ? `Your account is suspended: ${profile.suspend_reason}`
            : "Your account is currently suspended by an administrator.",
        } as any,
      };
    }

    await ensureProfileRow(data.user);
    if (!stayActive) {
      localStorage.setItem(EPHEMERAL_KEY, "1");
      sessionStorage.setItem(EPHEMERAL_KEY, "1");
    } else {
      localStorage.removeItem(EPHEMERAL_KEY);
      sessionStorage.removeItem(EPHEMERAL_KEY);
    }
  }

  return { data, error };
}

/** Called by ProtectedRoute on mount to enforce session-only logins. */
export async function enforceSessionPolicy(): Promise<boolean> {
  const inLocal   = localStorage.getItem(EPHEMERAL_KEY) === "1";
  const inSession = sessionStorage.getItem(EPHEMERAL_KEY) === "1";
  if (inLocal && !inSession) {
    await supabase.auth.signOut();
    localStorage.removeItem(EPHEMERAL_KEY);
    return true;
  }
  return false;
}

export async function signUp(
  email: string,
  password: string,
  fullName: string,
  studentId: string,
  phoneNumber?: string,
  university = "CIT-U"
) {
  // 1. Create the Supabase Auth user
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        student_id: studentId,
        phone_number: phoneNumber ?? null,
        university,
      },
    },
  });

  if (error || !data.user) return { data, error };

  // 2. Insert into public.users — the DB trigger also handles this,
  //    but we do it explicitly too so data is immediately available.
  await ensureProfileRow({
    id: data.user.id,
    email: data.user.email,
    user_metadata: {
      ...(data.user.user_metadata ?? {}),
      full_name: fullName,
      student_id: studentId,
      phone_number: phoneNumber ?? null,
      university,
    },
  });

  return { data, error: null };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Sends a password-reset email to the given address.
 * The link inside the email redirects to /reset-password where the user
 * can choose a new password.
 */
export async function requestPasswordReset(email: string) {
  const redirectTo = `${globalThis.location?.origin ?? ""}/reset-password`;
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });
  return { data, error };
}

/**
 * Updates the password of the currently-authenticated user.
 * Called on the /reset-password page after Supabase has exchanged the
 * magic-link token for a session.
 */
export async function updatePassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  return { data, error };
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// ─── Supabase Storage — Avatar helpers ────────────────────────────────────────

const AVATARS_BUCKET = "avatars";

/**
 * Uploads a compressed image Blob to the 'avatars' bucket, then writes the
 * resulting public URL to public.users.avatar_url.
 *
 * @returns The public URL (with cache-bust query string)
 * @throws  Plain Error on storage failure.
 *          Error with `.publicUrl` set if storage succeeded but DB update failed
 *          (so the caller can still update the UI while showing a warning).
 */
export async function uploadAvatar(userId: string, blob: Blob): Promise<string> {
  const filePath = `${userId}/avatar.webp`;

  // 1 — Upload to storage (upsert so re-uploads overwrite the old file)
  const { error: storageError } = await supabase.storage
    .from(AVATARS_BUCKET)
    .upload(filePath, blob, {
      contentType: "image/webp",
      upsert: true,
    });

  if (storageError) throw new Error(storageError.message);

  // 2 — Get the public URL and add a cache-bust timestamp
  const { data: urlData } = supabase.storage
    .from(AVATARS_BUCKET)
    .getPublicUrl(filePath);

  const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

  // 3 — Write the URL to users.avatar_url
  const { error: dbError } = await supabase
    .from("users")
    .update({ avatar_url: publicUrl })
    .eq("id", userId);

  if (dbError) {
    // Storage succeeded but DB write failed — surface both the error AND the URL
    const err = new Error(`Photo saved to storage, but profile link failed: ${dbError.message}`) as Error & { publicUrl: string };
    err.publicUrl = publicUrl;
    throw err;
  }

  return publicUrl;
}

// ─── Driver Presence ───────────────────────────────────────────────────────────

export type DriverStatus = "TAKING_ORDERS" | "ONLINE" | "OFFLINE";

/**
 * Updates the authenticated driver's availability status in public.users.
 * TAKING_ORDERS → green · shown on map · receives ride requests
 * ONLINE        → yellow · shown on map · NOT accepting requests
 * OFFLINE       → hidden from map and request feed
 */
export async function setDriverStatus(userId: string, status: DriverStatus) {
  const { error } = await supabase
    .from("users")
    .update({ driver_status: status })
    .eq("id", userId);
  return { error };
}

/**
 * Subscribes to real-time presence changes of all non-offline drivers.
 * Returns an unsubscribe function — call it in useEffect cleanup.
 */
export function subscribeToOnlineDrivers(
  callback: (drivers: OnlineDriver[]) => void
) {
  const fetchAll = async () => {
    const { data, error } = await supabase
      .from("users")
      .select("id, full_name, driver_status, vehicle, vehicle_type, rating")
      .neq("driver_status", "OFFLINE");

    if (error) {
      console.warn("[presence] fetch failed:", error.message);
      return;
    }

    // Explicitly filter out OFFLINE drivers client-side in case RLS or
    // stale cache returns them anyway (defensive guard).
    const online = (data ?? []).filter((d) => d.driver_status !== "OFFLINE");
    callback(online as OnlineDriver[]);
  };

  // Initial fetch
  fetchAll();

  // Use a unique channel name per call to avoid Supabase deduplicating
  // subscriptions when multiple components mount simultaneously.
  const channelName = `online-drivers-${Date.now()}`;
  const channel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "users" },
      () => {
        // Re-fetch the full list on any user row change
        fetchAll();
      }
    )
    .subscribe();

  // Fallback polling — catches cases where Realtime isn't fully enabled
  const pollId = setInterval(fetchAll, 8000);

  return () => {
    clearInterval(pollId);
    supabase.removeChannel(channel);
  };
}

export interface OnlineDriver {
  id: string;
  full_name: string;
  driver_status: DriverStatus;
  vehicle?: string | null;
  vehicle_type?: string | null;
  rating?: number | null;
}

export async function getDriverVehicleProfile(userId: string): Promise<{
  vehicle: string | null;
  vehicle_type: string | null;
  driver_verification_status: string | null;
}> {
  const { data, error } = await supabase
    .from("users")
    .select("vehicle, vehicle_type, driver_verification_status")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    return { vehicle: null, vehicle_type: null, driver_verification_status: null };
  }

  return {
    vehicle: data.vehicle ?? null,
    vehicle_type: data.vehicle_type ?? null,
    driver_verification_status: data.driver_verification_status ?? null,
  };
}

// ─── Ride Requests ─────────────────────────────────────────────────────────────

export interface RideRequestPayload {
  rider_id: string;
  rider_name: string;
  pickup: string;
  dropoff: string;
  fare?: number | null;       // rider-provided fare
  distance_km: number;
  ride_type: "HABAL" | "CAR" | "SHUTTLE" | "PREMIUM";
  passenger_count?: number;
  scheduled_at?: string | null;
  // Coordinates stored so drivers can inspect the route without re-geocoding
  pickup_lat?: number;
  pickup_lng?: number;
  dropoff_lat?: number;
  dropoff_lng?: number;
}

/**
 * Cancels any existing SEARCHING rides for this rider before posting a new one.
 * Prevents duplicate cards from appearing in the driver feed.
 */
export async function cancelExistingSearchingRides(riderId: string) {
  await supabase
    .from("rides")
    .update({ status: "CANCELLED", cancelled_at: new Date().toISOString() })
    .eq("rider_id", riderId)
    .eq("status", "SEARCHING");
}

/**
 * Posts a new ride request to Supabase with status = 'SEARCHING'.
 * Returns the created ride's id so the caller can subscribe to it.
 */
export async function postRideRequest(payload: RideRequestPayload) {
  const { data, error } = await supabase
    .from("rides")
    .insert({
      rider_id:         payload.rider_id,
      rider_name:       payload.rider_name,
      pickup:           payload.pickup,
      dropoff:          payload.dropoff,
      fare:             payload.fare,
      distance_km:      payload.distance_km,
      ride_type:        payload.ride_type,
      passenger_count:  payload.passenger_count ?? 1,
      scheduled_at:     payload.scheduled_at ?? null,
      status:           "SEARCHING",
      // Store exact coords so drivers can render routes without geocoding
      pickup_lat:       payload.pickup_lat  ?? null,
      pickup_lng:       payload.pickup_lng  ?? null,
      dropoff_lat:      payload.dropoff_lat ?? null,
      dropoff_lng:      payload.dropoff_lng ?? null,
    })
    .select("id")
    .single();

  if (error?.message?.toLowerCase().includes("rider_name")) {
    const retry = await supabase
      .from("rides")
      .insert({
        rider_id:         payload.rider_id,
        pickup:           payload.pickup,
        dropoff:          payload.dropoff,
        fare:             payload.fare,
        distance_km:      payload.distance_km,
        ride_type:        payload.ride_type,
        passenger_count:  payload.passenger_count ?? 1,
        scheduled_at:     payload.scheduled_at ?? null,
        status:           "SEARCHING",
        pickup_lat:       payload.pickup_lat  ?? null,
        pickup_lng:       payload.pickup_lng  ?? null,
        dropoff_lat:      payload.dropoff_lat ?? null,
        dropoff_lng:      payload.dropoff_lng ?? null,
      })
      .select("id")
      .single();
    return retry;
  }

  return { data, error };
}

/**
 * Subscribes to all rides in SEARCHING status.
 * Fires callback with the full list whenever a ride is inserted, updated, or deleted.
 * Returns an unsubscribe function.
 */
export function subscribeToSearchingRides(
  callback: (rides: SearchingRide[]) => void
) {
  const fetchAll = async () => {
    const { data, error } = await supabase
      .from("rides")
      .select("id, rider_id, rider_name, pickup, dropoff, fare, distance_km, passenger_count, ride_type, created_at, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng")
      .eq("status", "SEARCHING")
      .order("created_at", { ascending: false });

    if (!error && data) {
      // Filter out stale SEARCHING rides (rider left the app without cancelling).
      // Anything older than 20 minutes is treated as expired.
      const STALE_MS = 20 * 60 * 1000;
      const fresh = data.filter(
        (r) => Date.now() - new Date(r.created_at).getTime() < STALE_MS
      );
      callback(fresh as SearchingRide[]);
      return;
    }

    if (error) {
      console.warn("[rides] fetch failed:", error.message);
    }

    const fallback = await supabase
      .from("rides")
      .select("id, rider_id, pickup, dropoff, fare, distance_km, passenger_count, ride_type, created_at, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng")
      .eq("status", "SEARCHING")
      .order("created_at", { ascending: false });

    if (fallback.data) {
      const normalized = fallback.data.map((ride) => ({
        ...ride,
        rider_name: null,
      }));
      callback(normalized as SearchingRide[]);
    } else if (fallback.error) {
      console.error("[rides] fallback fetch also failed:", fallback.error.message,
        "— check RLS: drivers need SELECT on rides WHERE status='SEARCHING'");
    }
  };

  // Initial load
  fetchAll();

  // Unique channel name prevents Supabase from deduplicating subscriptions
  // when the driver component remounts (e.g. status change unmounts/remounts).
  const channelName = `searching-rides-${Date.now()}`;
  const channel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "rides" },
      () => fetchAll()
    )
    .subscribe();

  // Polling fallback — catches cases where Realtime isn't fully enabled
  const pollId = setInterval(fetchAll, 8000);

  return () => {
    clearInterval(pollId);
    supabase.removeChannel(channel);
  };
}

export interface SearchingRide {
  id: string;
  rider_id: string;
  rider_name: string | null;
  pickup: string;
  dropoff: string;
  fare: number;
  distance_km: number;
  passenger_count: number | null;
  ride_type: string;
  created_at: string;
  // Exact coordinates stored when rider posted the ride
  pickup_lat:  number | null;
  pickup_lng:  number | null;
  dropoff_lat: number | null;
  dropoff_lng: number | null;
}

/**
 * Cancels a ride by setting its status to CANCELLED.
 * The driver feed's Realtime subscription will remove it instantly.
 */
export async function cancelRide(rideId: string, reason?: string) {
  const { error } = await supabase
    .from("rides")
    .update({
      status: "CANCELLED",
      cancelled_at: new Date().toISOString(),
      cancel_reason: reason ?? "Cancelled by rider",
    })
    .eq("id", rideId);
  return { error };
}

/**
 * @deprecated Use proposeFare() instead for the fare-negotiation flow.
 * Driver accepts a ride — sets status to ACCEPTED and assigns driver_id.
 * Kept for backward compatibility only.
 */
export async function acceptRideRequest(rideId: string, driverId: string) {
  const { data, error } = await supabase
    .from("rides")
    .update({ status: "ACCEPTED", driver_id: driverId })
    .eq("id", rideId)
    .select("id, driver_id")
    .single();
  return { data, error };
}

/**
 * Driver accepts a rider-priced request directly.
 * Preserves rider-set fare and marks the ride as accepted.
 */
export async function acceptRiderPricedRide(rideId: string, driverId: string) {
  const { data, error } = await supabase
    .from("rides")
    .update({
      status: "ACCEPTED",
      driver_id: driverId,
      accepted_at: new Date().toISOString(),
    })
    .eq("id", rideId)
    .select("id, driver_id, fare")
    .single();
  return { data, error };
}

// ─── Notifications & Admin helpers (scaffolds) ─────────────────────────────

/**
 * Inserts a simple notification row for a user. Intended for admin-driven
 * notifications such as verification decision, role change, or manual alerts.
 * Requires a `notifications` table in Supabase (see SQL below).
 */
export async function createNotification(userId: string, title: string, body: string, meta?: object) {
  const { error } = await supabase
    .from("notifications")
    .insert({
      user_id: userId,
      title,
      body,
      metadata: meta ?? {},
      read: false,
      created_at: new Date().toISOString(),
    });
  return { data: null, error };
}

/**
 * Soft-deactivate a user by setting a reversible flag. Server-side RLS
 * must enforce blocks against taking new rides when `deactivated = true`.
 */
export async function softDeactivateUser(userId: string, reason?: string) {
  const { data, error } = await supabase
    .from("users")
    .update({ deactivated: true, deactivated_reason: reason ?? null, deactivated_at: new Date().toISOString() })
    .eq("id", userId)
    .select("id");
  return { data, error };
}

// ─── Fare Negotiation ──────────────────────────────────────────────────────────

/**
 * Driver proposes a fare — sets status to FARE_PROPOSED, assigns driver_id and fare.
 * The ride stays off the search feed until the rider accepts or declines.
 */
export async function proposeFare(rideId: string, driverId: string, fare: number) {
  const { data, error } = await supabase
    .from("rides")
    .update({
      status:      "FARE_PROPOSED",
      driver_id:   driverId,
      fare,
      accepted_at: null,
    })
    .eq("id", rideId)
    .select("id, driver_id, fare")
    .single();
  return { data, error };
}

/**
 * Rider accepts the proposed fare — sets status to ACCEPTED.
 * The driver's subscribeToRide fires and advances them to EN_ROUTE.
 */
export async function acceptFare(rideId: string) {
  const { data, error } = await supabase
    .from("rides")
    .update({ status: "ACCEPTED", accepted_at: new Date().toISOString() })
    .eq("id", rideId)
    .select("id")
    .single();
  return { data, error };
}

/**
 * Rider declines the proposed fare — resets status to SEARCHING and clears driver/fare.
 * The ride re-appears in all drivers' feeds.
 */
export async function declineFare(rideId: string) {
  const { data, error } = await supabase
    .from("rides")
    .update({
      status:    "SEARCHING",
      driver_id: null,
      fare:      null,
    })
    .eq("id", rideId)
    .select("id")
    .single();
  return { data, error };
}

/**
 * Driver-side reset after a fare proposal is declined or withdrawn.
 * Restores the ride to SEARCHING with the rider's original fare so other
 * drivers see the correct price in their feed.
 */
export async function resetFareProposal(rideId: string, originalFare: number) {
  const { data, error } = await supabase
    .from("rides")
    .update({
      status:    "SEARCHING",
      driver_id: null,
      fare:      originalFare,
    })
    .eq("id", rideId)
    .select("id")
    .single();
  return { data, error };
}

/**
 * Subscribes to a single ride row by id.
 * Used by the rider to detect when a driver accepts and the status changes.
 * Returns an unsubscribe function.
 */
export function subscribeToRide(
  rideId: string,
  callback: (ride: { id: string; status: string; driver_id: string | null; started_at?: string | null; fare?: number | null }) => void
) {
  const channel = supabase
    .channel(`ride-${rideId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "rides",
        filter: `id=eq.${rideId}`,
      },
      (payload) => {
        callback(payload.new as { id: string; status: string; driver_id: string | null });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Fetches today's completed ride count and total earnings for a driver.
 */
export async function getDriverStats(driverId: string): Promise<{ totalRidesToday: number; earningsToday: number }> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("rides")
    .select("fare")
    .eq("driver_id", driverId)
    .eq("status", "COMPLETED")
    .gte("completed_at", todayStart.toISOString());

  if (error || !data) return { totalRidesToday: 0, earningsToday: 0 };

  return {
    totalRidesToday: data.length,
    earningsToday: data.reduce((sum, r) => sum + (r.fare ?? 0), 0),
  };
}

// ─── Trip Control ──────────────────────────────────────────────────────────────

/**
 * Driver starts the trip — sets status to IN_TRANSIT and records started_at.
 */
export async function startTrip(rideId: string) {
  const { data, error } = await supabase
    .from("rides")
    .update({ status: "IN_TRANSIT", started_at: new Date().toISOString() })
    .eq("id", rideId)
    .select("id")
    .single();
  return { data, error };
}

/**
 * Driver ends the trip — sets status to COMPLETED and records completed_at.
 * Also clears GPS columns so stale coordinates don't linger.
 */
export async function completeTrip(rideId: string) {
  const { data, error } = await supabase
    .from("rides")
    .update({
      status:       "COMPLETED",
      completed_at: new Date().toISOString(),
      driver_lat:   null,
      driver_lng:   null,
    })
    .eq("id", rideId)
    .select("id")
    .single();
  return { data, error };
}

// ─── GPS Tracking ──────────────────────────────────────────────────────────────

/**
 * Pushes the driver's current GPS coordinates to the active ride row.
 * Called every ~3 seconds by the driver while trip is IN_TRANSIT.
 */
export async function updateDriverGPS(rideId: string, lat: number, lng: number) {
  await supabase
    .from("rides")
    .update({
      driver_lat: lat,
      driver_lng: lng,
      driver_last_seen: new Date().toISOString(),
    })
    .eq("id", rideId);
}

/**
 * Subscribes to GPS updates on a single ride row.
 * Used by the rider to see the driver moving on the map.
 * Returns an unsubscribe function.
 */
export function subscribeToRideGPS(
  rideId: string,
  callback: (coords: { lat: number; lng: number } | null) => void
) {
  const channel = supabase
    .channel(`ride-gps-${rideId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "rides",
        filter: `id=eq.${rideId}`,
      },
      (payload) => {
        const row = payload.new as { driver_lat?: number | null; driver_lng?: number | null };
        if (row.driver_lat != null && row.driver_lng != null) {
          callback({ lat: row.driver_lat, lng: row.driver_lng });
        }
      }
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

// ─── Ride Rating ───────────────────────────────────────────────────────────────

/**
 * Submits the rider's rating and tags for a completed ride.
 * Called from RiderMatchingOverlay when the rider submits their star rating.
 */
export async function submitRideRating(rideId: string, stars: number, tags: string[]) {
  const result = await supabase
    .from("rides")
    .update({ rider_rating: stars, rider_tags: tags })
    .eq("id", rideId);
  if (result.error) {
    return result;
  }

  // Propagate to driver's profile rating.
  const { data: ride } = await supabase
    .from("rides")
    .select("driver_id")
    .eq("id", rideId)
    .maybeSingle();
  if (ride?.driver_id) {
    await refreshUserRatingFromRides(ride.driver_id);
  }
  return result;
}

// ─── SOS System ────────────────────────────────────────────────────────────────

export type SOSType = "ALARM" | "SILENT";

export interface SOSAlert {
  id: string;
  user_id: string;
  ride_id: string | null;
  type: SOSType;
  location: string | null;
  lat: number | null;
  lng: number | null;
  status: "ACTIVE" | "RESOLVED";
  assigned_to: string | null;
  resolution_note: string | null;
  resolved_by: string | null;
  triggered_at: string;
  resolved_at: string | null;
}

/**
 * Triggers an SOS alert — inserts a row into sos_alerts.
 */
export async function triggerSOS(
  userId: string,
  rideId: string | null,
  type: SOSType,
  lat?: number,
  lng?: number
) {
  const { data, error } = await supabase
    .from("sos_alerts")
    .insert({
      user_id: userId,
      ride_id: rideId,
      type,
      lat: lat ?? null,
      lng: lng ?? null,
      location: lat ? `${lat.toFixed(4)}, ${lng?.toFixed(4)}` : "Unknown",
      status: "ACTIVE",
    })
    .select("id")
    .single();
  return { data, error };
}

/**
 * Admin subscription — all SOS alerts with Realtime updates.
 */
export function subscribeToSOS(callback: (alerts: SOSAlert[]) => void) {
  const fetchAll = () =>
    supabase
      .from("sos_alerts")
      .select("*")
      .order("triggered_at", { ascending: false })
      .then(({ data }) => {
        if (data) callback(data as SOSAlert[]);
      });

  fetchAll();

  const channel = supabase
    .channel("sos-admin")
    .on("postgres_changes", { event: "*", schema: "public", table: "sos_alerts" }, () => fetchAll())
    .subscribe();

  return () => supabase.removeChannel(channel);
}

/**
 * Rider/driver subscription — listens for SOS on a specific ride
 * so the other party sees "Help is on the way" when the alert fires.
 */
export function subscribeToRideSOS(
  rideId: string,
  callback: (alert: SOSAlert) => void
) {
  const channel = supabase
    .channel(`sos-ride-${rideId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "sos_alerts", filter: `ride_id=eq.${rideId}` },
      (payload) => callback(payload.new as SOSAlert)
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

/**
 * Admin resolves an SOS alert.
 */
export async function resolveSOS(alertId: string, resolvedBy: string, note: string) {
  const { error } = await supabase
    .from("sos_alerts")
    .update({
      status: "RESOLVED",
      resolved_by: resolvedBy,
      resolution_note: note,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", alertId);
  return { error };
}

/**
 * Assigns an SOS alert to a responder (admin name or user id).
 */
export async function assignSOS(alertId: string, assignee: string) {
  const { error } = await supabase
    .from("sos_alerts")
    .update({ assigned_to: assignee })
    .eq("id", alertId);
  return { error };
}

/**
 * Removes the avatar file from storage and clears users.avatar_url.
 * Silently ignores "Not Found" errors from storage (file already gone).
 */
export async function removeAvatar(userId: string): Promise<void> {
  const filePath = `${userId}/avatar.webp`;

  const { error: storageError } = await supabase.storage
    .from(AVATARS_BUCKET)
    .remove([filePath]);

  // Ignore 404 — file may have already been deleted
  if (storageError && !storageError.message.toLowerCase().includes("not found")) {
    throw new Error(storageError.message);
  }

  const { error: dbError } = await supabase
    .from("users")
    .update({ avatar_url: null })
    .eq("id", userId);

  if (dbError) throw new Error(dbError.message);
}

// ─── Admin — User Management ────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  full_name: string;
  email: string;
  student_id: string | null;
  phone_number: string | null;
  university: string | null;
  role: string | null;
  driver_status: string | null;
  account_status: string | null; // ACTIVE | SUSPENDED | PENDING
  suspend_reason: string | null;
  suspended_at: string | null;
  suspended_until: string | null;
  rating: number | null;
  vehicle: string | null;
  vehicle_type: string | null;
  created_at: string;
  rides_completed: number;
}

const API_BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL ??
  "";

async function apiFetch(path: string, init?: RequestInit) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  const headers: Record<string, string> = {
    ...(init?.headers as any),
    "Content-Type": "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Network request failed";
    return {
      data: null,
      error: new Error(
        `Backend API is unreachable at ${API_BASE_URL}. Start the backend server, then retry. (${message})`
      ),
    };
  }
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    // Backend sendError wraps message in { error: { message, details } }
    const message =
      json?.error?.message ||
      json?.error ||
      json?.message ||
      `Request failed (${res.status})`;
    return { data: null, error: new Error(String(message)) };
  }
  // Backend uses { success, data } envelope via sendSuccess
  return { data: json?.data ?? json, error: null as Error | null };
}

/**
 * Fetches all users for the admin panel, including a count of completed rides.
 */
export async function getUsersForAdmin(): Promise<AdminUser[]> {
  const { data, error } = await apiFetch("/api/users", { method: "GET" });
  if (error) throw error;
  if (!data) return [];
  // Backend currently returns full user rows; cast to AdminUser-ish.
  // rides_completed is computed client-side in UsersPage anyway.
  return (data as any[]).map((u) => ({
    ...u,
    rides_completed: u.rides_completed ?? 0,
    account_status: u.account_status ?? "ACTIVE",
  })) as AdminUser[];
}

/**
 * Suspends a user account — sets account_status=SUSPENDED and stores the reason.
 */
export async function suspendUser(userId: string, reason: string, durationHours?: number) {
  const { error } = await apiFetch(`/api/users/${userId}/suspend`, {
    method: "PATCH",
    body: JSON.stringify({ reason, durationHours }),
  });
  return { error };
}

/**
 * Reactivates a suspended user — sets account_status=ACTIVE and clears suspension fields.
 */
export async function reactivateUser(userId: string) {
  const { error } = await apiFetch(`/api/users/${userId}/reactivate`, {
    method: "PATCH",
    body: JSON.stringify({}),
  });
  return { error };
}

/**
 * Deletes a user account (admin only).
 */
export async function deleteUser(userId: string) {
  const { error } = await apiFetch(`/api/users/${userId}`, {
    method: "DELETE",
  });
  return { error };
}

// ─── Admin — Ride Management ────────────────────────────────────────────────────

export interface AdminRide {
  id: string;
  rider_id: string;
  rider_name: string | null;
  driver_id: string | null;
  pickup: string;
  dropoff: string;
  fare: number;
  status: string;
  ride_type: string;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  pickup_lat: number | null;
  pickup_lng: number | null;
  dropoff_lat: number | null;
  dropoff_lng: number | null;
  driver_lat: number | null;
  driver_lng: number | null;
  // Joined
  driver_name: string | null;
  driver_vehicle: string | null;
}

/**
 * Fetches all rides for the admin rides page, joining driver name via a second query.
 */
export async function getAdminRides(): Promise<AdminRide[]> {
  const { data: rides, error } = await supabase
    .from("rides")
    .select(`
      id, rider_id, rider_name, driver_id, pickup, dropoff, fare,
      status, ride_type, created_at, started_at, completed_at, cancelled_at,
      pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, driver_lat, driver_lng
    `)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error || !rides) return [];

  // Collect unique driver IDs and resolve their names
  const driverIds = [...new Set(rides.map((r) => r.driver_id).filter(Boolean))];
  let driverMap: Record<string, { full_name: string; vehicle: string | null }> = {};

  if (driverIds.length > 0) {
    const { data: drivers } = await supabase
      .from("users")
      .select("id, full_name, vehicle")
      .in("id", driverIds as string[]);
    (drivers ?? []).forEach((d) => { driverMap[d.id] = d; });
  }

  return rides.map((r) => ({
    ...r,
    driver_name:    r.driver_id ? (driverMap[r.driver_id]?.full_name ?? null) : null,
    driver_vehicle: r.driver_id ? (driverMap[r.driver_id]?.vehicle   ?? null) : null,
  })) as AdminRide[];
}

/**
 * Subscribes to real-time ride changes for the admin rides page.
 * Returns an unsubscribe function.
 */
export function subscribeToAdminRides(callback: () => void) {
  const channel = supabase
    .channel("admin-rides")
    .on("postgres_changes", { event: "*", schema: "public", table: "rides" }, callback)
    .subscribe();
  return () => supabase.removeChannel(channel);
}

/**
 * Force-ends an active ride — marks it COMPLETED with a note.
 */
export async function forceEndRide(rideId: string) {
  const { error } = await supabase
    .from("rides")
    .update({
      status: "COMPLETED",
      completed_at: new Date().toISOString(),
      driver_lat: null,
      driver_lng: null,
    })
    .eq("id", rideId);
  return { error };
}

// ─── Admin — Dashboard Stats ────────────────────────────────────────────────────

export interface AdminStats {
  totalUsers: number;
  totalDrivers: number;
  totalRiders: number;
  pendingVerifications: number;
  ridesInProgress: number;
  ridesCompleted: number;
  ridesCancelled: number;
  activeSOS: number;
  revenueToday: number;
}

/**
 * Fetches live aggregate stats for the admin dashboard.
 * Runs 4 parallel queries to minimise latency.
 */
export async function getAdminStats(): Promise<AdminStats> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayISO = todayStart.toISOString();

  const [usersRes, ridesRes, sosRes] = await Promise.all([
    supabase.from("users").select("id, role, account_status"),
    supabase.from("rides").select("id, status, fare, completed_at"),
    supabase.from("sos_alerts").select("id, status"),
  ]);

  const users = usersRes.data ?? [];
  const rides = ridesRes.data ?? [];
  const sos   = sosRes.data ?? [];

  const ridesCompletedToday = rides.filter(
    (r) => r.status === "COMPLETED" && r.completed_at && r.completed_at >= todayISO
  );

  return {
    totalUsers:            users.length,
    totalDrivers:          users.filter((u) => u.role === "DRIVER").length,
    totalRiders:           users.filter((u) => u.role === "RIDER" || !u.role).length,
    pendingVerifications:  users.filter((u) => u.account_status === "PENDING").length,
    ridesInProgress:       rides.filter((r) => r.status === "IN_TRANSIT").length,
    ridesCompleted:        rides.filter((r) => r.status === "COMPLETED").length,
    ridesCancelled:        rides.filter((r) => r.status === "CANCELLED").length,
    activeSOS:             sos.filter((s)   => s.status === "ACTIVE").length,
    revenueToday:          ridesCompletedToday.reduce((sum, r) => sum + (r.fare ?? 0), 0),
  };
}

// ─── Admin — Verifications ──────────────────────────────────────────────────────

export interface VerificationUser {
  id: string;
  full_name: string;
  email: string;
  student_id: string | null;
  phone_number: string | null;
  university: string | null;
  role: string | null;
  account_status: string;
  suspend_reason: string | null;
  avatar_url: string | null;
  created_at: string;
  driver_verification_status?: string;
  driver_full_address?: string | null;
  driver_college?: string | null;
  driver_course?: string | null;
  driver_plate_number?: string | null;
  driver_license_number?: string | null;
  license_front_url?: string | null;
  license_back_url?: string | null;
  vehicle_reg_url?: string | null;
  docs_submitted_at?: string | null;
  driver_rejection_reason?: string | null;
  driver_verified_at?: string | null;
}

/** Returns all users with account_status = PENDING (awaiting admin review). */
export async function getVerificationQueue(): Promise<VerificationUser[]> {
  const { data, error } = await apiFetch("/api/users/verification/account/pending", { method: "GET" });
  if (error) throw error;
  return !data ? [] : (data as VerificationUser[]);
}

/** Returns recently processed users (ACTIVE or REJECTED), last 50. */
export async function getProcessedVerifications(): Promise<VerificationUser[]> {
  const { data, error } = await apiFetch("/api/users/verification/account/processed", { method: "GET" });
  if (error) throw error;
  return !data ? [] : (data as VerificationUser[]);
}

// ─── Driver Verification Workflow ───────────────────────────────────────────────

export interface DriverVerificationApplicationInput {
  fullAddress: string;
  college: string;
  course: string;
  plateNumber: string;
  licenseNumber: string;
}

export async function submitDriverVerificationRequest(
  userId: string,
  input: DriverVerificationApplicationInput
) {
  const { error } = await supabase
    .from("users")
    .update({
      driver_verification_status: "PENDING",
      driver_full_address: input.fullAddress,
      driver_college: input.college,
      driver_course: input.course,
      driver_plate_number: input.plateNumber,
      driver_license_number: input.licenseNumber,
      driver_rejection_reason: null,
      driver_verified_at: null,
    })
    .eq("id", userId);
  return { error };
}

export async function getDriverVerificationQueue(): Promise<VerificationUser[]> {
  const { data, error } = await apiFetch("/api/users/verification/driver/pending", { method: "GET" });
  if (error) throw error;
  return !data ? [] : (data as VerificationUser[]);
}

export async function getProcessedDriverVerifications(): Promise<VerificationUser[]> {
  const { data, error } = await apiFetch("/api/users/verification/driver/processed", { method: "GET" });
  if (error) throw error;
  return !data ? [] : (data as VerificationUser[]);
}

export async function approveDriverVerification(userId: string) {
  const { error } = await apiFetch(`/api/users/${userId}/verification/driver/approve`, {
    method: "PATCH",
    body: JSON.stringify({}),
  });
  return { error };
}

export async function rejectDriverVerification(userId: string, reason: string) {
  const { error } = await apiFetch(`/api/users/${userId}/verification/driver/reject`, {
    method: "PATCH",
    body: JSON.stringify({ reason }),
  });
  return { error };
}

export async function revokeDriverPermission(userId: string, reason = "Revoked by admin") {
  const { error } = await apiFetch(`/api/users/${userId}/revoke-driver`, {
    method: "PATCH",
    body: JSON.stringify({ reason }),
  });
  return { error };
}

export async function setUserRoleForAdmin(
  userId: string,
  role: "RIDER" | "DRIVER" | "BOTH" | "ADMIN"
) {
  const { error } = await apiFetch(`/api/users/${userId}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
  return { error };
}

/** Approves a pending verification — sets account_status = ACTIVE. */
export async function approveVerification(userId: string) {
  const { error } = await apiFetch(`/api/users/${userId}/verification/account/approve`, {
    method: "PATCH",
    body: JSON.stringify({}),
  });
  return { error };
}

/** Rejects a pending verification — sets account_status = REJECTED + stores reason. */
export async function rejectVerification(userId: string, reason: string) {
  const { error } = await apiFetch(`/api/users/${userId}/verification/account/reject`, {
    method: "PATCH",
    body: JSON.stringify({ reason }),
  });
  return { error };
}

/** Realtime subscription for user table changes (drives verification queue updates). */
export function subscribeToVerifications(callback: () => void) {
  const channel = supabase
    .channel("admin-verifications")
    .on("postgres_changes", { event: "*", schema: "public", table: "users" }, callback)
    .subscribe();
  return () => supabase.removeChannel(channel);
}

// ─── Admin — Role lookup (used by ProtectedRoute for admin gate) ──────────────

/** Returns the DB role for a user. More secure than inspecting user_metadata. */
export async function getUserRole(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();
  return data?.role ?? null;
}

// ─── Ride History ─────────────────────────────────────────────────────────────

export interface RideHistoryItem {
  id: string;
  pickup: string;
  dropoff: string;
  fare: number | null;
  distance_km: number | null;
  ride_type: string | null;
  status: string;
  rider_rating: number | null;
  driver_rating: number | null;
  driver_tags: string[] | null;
  created_at: string;
  completed_at: string | null;
  rider_id: string;
  driver_id: string | null;
}

/**
 * Fetches ride history for a user.
 * role = "RIDER"  → rides where rider_id = userId
 * role = "DRIVER" → rides where driver_id = userId
 */
export async function getRideHistory(
  userId: string,
  role: "RIDER" | "DRIVER"
): Promise<RideHistoryItem[]> {
  const col = role === "RIDER" ? "rider_id" : "driver_id";
  const { data, error } = await supabase
    .from("rides")
    .select("id, pickup, dropoff, fare, distance_km, ride_type, status, rider_rating, driver_rating, driver_tags, created_at, completed_at, rider_id, driver_id")
    .eq(col, userId)
    .in("status", ["COMPLETED", "CANCELLED"])
    .order("created_at", { ascending: false })
    .limit(100);
  return (error || !data) ? [] : (data as RideHistoryItem[]);
}

/**
 * Submits driver's rating and tags for the rider on a completed ride.
 */
export async function submitDriverRiderRating(rideId: string, stars: number, tags: string[]) {
  const result = await supabase
    .from("rides")
    .update({ driver_rating: stars, driver_tags: tags })
    .eq("id", rideId);
  if (result.error) return result;

  // Propagate to rider's profile rating.
  const { data: ride } = await supabase
    .from("rides")
    .select("rider_id")
    .eq("id", rideId)
    .maybeSingle();
  if (ride?.rider_id) {
    await refreshUserRatingFromRides(ride.rider_id);
  }
  return result;
}

/**
 * Recomputes a user's aggregate rating from received ride ratings:
 * - rider_rating received when user was the driver
 * - driver_rating received when user was the rider
 */
export async function refreshUserRatingFromRides(userId: string) {
  // Use SECURITY DEFINER RPC to safely update another user's rating under RLS.
  const { error } = await supabase.rpc("refresh_user_rating_from_rides", {
    target_user_id: userId,
  });
  return { error: error ?? null };
}

// ─── Messaging / Conversations ────────────────────────────────────────────────

export type MessageType = "text" | "offer" | "system";
export type OfferStatus = "PENDING" | "COUNTERED" | "ACCEPTED" | "DECLINED";
export type ConversationStatus = "REQUESTED" | "NEGOTIATING" | "AGREED" | "COMPLETED" | "CANCELLED";

export interface PublicUserSearchRow {
  id: string;
  full_name: string;
  role: string | null;
  vehicle: string | null;
  vehicle_type: string | null;
  rating: number | null;
  driver_verification_status: string | null;
}

const isMissingChatTableError = (error: { message?: string; code?: string } | null | undefined) => {
  const message = error?.message ?? "";
  return (
    message.includes("schema cache") ||
    message.includes("public.conversations") ||
    message.includes("public.messages")
  );
};

export interface ConversationRow {
  id: string;
  rider_id: string;
  driver_id: string;
  status: ConversationStatus;
  pickup: string | null;
  dropoff: string | null;
  pickup_lat: number | null;
  pickup_lng: number | null;
  dropoff_lat: number | null;
  dropoff_lng: number | null;
  agreed_fare: number | null;
  ride_id: string | null;
  last_message_at: string;
  created_at: string;
}

export interface MessageRow {
  id: string;
  conversation_id: string | null;
  ride_id: string | null;
  sender_id: string;
  content: string;
  type: MessageType;
  offer_amount: number | null;
  offer_status: OfferStatus | null;
  sent_at: string;
}

export async function searchRegisteredUsers(
  query: string,
  role?: "RIDER" | "DRIVER"
): Promise<PublicUserSearchRow[]> {
  const trimmedQuery = query.trim();
  let request = supabase
    .from("users")
    .select("id, full_name, role, vehicle, vehicle_type, rating, driver_verification_status")
    .order("full_name", { ascending: true })
    .limit(25);

  if (role) {
    request = request.eq("role", role);
  }

  if (trimmedQuery) {
    const escaped = trimmedQuery.replace(/%/g, "\\%").replace(/_/g, "\\_");
    request = request.or(
      `full_name.ilike.%${escaped}%,student_id.ilike.%${escaped}%,email.ilike.%${escaped}%`
    );
  }

  const { data, error } = await request;
  if (error) {
    if (!isMissingChatTableError(error)) {
      console.warn("[chat] searchRegisteredUsers failed:", error.message);
    }
    return [];
  }

  return (data ?? []) as PublicUserSearchRow[];
}

/**
 * Returns an existing conversation between rider+driver or creates one.
 * Uses an upsert on the UNIQUE(rider_id, driver_id) constraint.
 */
export async function getOrCreateConversation(
  riderId: string,
  driverId: string
): Promise<ConversationRow | null> {
  const { data, error } = await supabase
    .from("conversations")
    .upsert(
      { rider_id: riderId, driver_id: driverId },
      { onConflict: "rider_id,driver_id", ignoreDuplicates: false }
    )
    .select()
    .single();
  if (error) {
    if (!isMissingChatTableError(error)) {
      console.warn("[chat] upsert conversation failed:", error.message);
    }
    // Try plain select as fallback (row already existed)
    const { data: existing } = await supabase
      .from("conversations")
      .select()
      .eq("rider_id", riderId)
      .eq("driver_id", driverId)
      .single();
    return existing as ConversationRow | null;
  }
  return data as ConversationRow;
}

/** Fetches all conversations for a user (as rider or driver), newest first. */
export async function getConversations(userId: string): Promise<ConversationRow[]> {
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .or(`rider_id.eq.${userId},driver_id.eq.${userId}`)
    .order("last_message_at", { ascending: false });
  if (error) {
    if (!isMissingChatTableError(error)) {
      console.warn("[chat] getConversations failed:", error.message);
    }
    return [];
  }
  return (data ?? []) as ConversationRow[];
}

/** Fetches all messages for a conversation, oldest first. */
export async function getMessages(conversationId: string): Promise<MessageRow[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("sent_at", { ascending: true });
  if (error) {
    if (!isMissingChatTableError(error)) {
      console.warn("[chat] getMessages failed:", error.message);
    }
    return [];
  }
  return (data ?? []) as MessageRow[];
}

/** Sends a plain text message and bumps conversation.last_message_at. */
export async function sendTextMessage(
  conversationId: string,
  senderId: string,
  content: string
): Promise<MessageRow | null> {
  const { data, error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: senderId, content, type: "text" })
    .select()
    .single();
  if (error) {
    if (!isMissingChatTableError(error)) {
      console.warn("[chat] sendTextMessage failed:", error.message);
    }
    return null;
  }
  await supabase
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversationId);
  return data as MessageRow;
}

/** Driver or rider sends a fare offer. */
export async function sendOffer(
  conversationId: string,
  senderId: string,
  amount: number,
  details?: { pickup?: string; dropoff?: string; passengers?: number }
): Promise<MessageRow | null> {
  const content = details
    ? JSON.stringify({ amount, ...details })
    : `₱${amount.toFixed(2)}`;
  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content,
      type: "offer",
      offer_amount: amount,
      offer_status: "PENDING",
    })
    .select()
    .single();
  if (error) {
    if (!isMissingChatTableError(error)) {
      console.warn("[chat] sendOffer failed:", error.message);
    }
    return null;
  }
  await supabase
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversationId);
  return data as MessageRow;
}

/** Updates an offer message status (ACCEPTED / DECLINED / COUNTERED). */
export async function respondToOffer(
  messageId: string,
  action: "ACCEPTED" | "DECLINED" | "COUNTERED"
): Promise<void> {
  await supabase
    .from("messages")
    .update({ offer_status: action })
    .eq("id", messageId);
}

/** Marks conversation as AGREED with the agreed fare. */
export async function agreeOnFare(
  conversationId: string,
  fare: number
): Promise<void> {
  await supabase
    .from("conversations")
    .update({ status: "AGREED", agreed_fare: fare, last_message_at: new Date().toISOString() })
    .eq("id", conversationId);
}

/**
 * Creates a ride from an agreed conversation, links it back to the conversation.
 * Returns the new ride id.
 */
export async function createRideFromConversation(
  conversationId: string,
  riderId: string,
  driverId: string,
  pickup: string,
  dropoff: string,
  fare: number,
  pickupLat?: number,
  pickupLng?: number,
  dropoffLat?: number,
  dropoffLng?: number
): Promise<string | null> {
  const { data: ride, error: rideError } = await supabase
    .from("rides")
    .insert({
      rider_id: riderId,
      driver_id: driverId,
      pickup,
      dropoff,
      fare,
      status: "ACCEPTED",
      pickup_lat: pickupLat ?? null,
      pickup_lng: pickupLng ?? null,
      dropoff_lat: dropoffLat ?? null,
      dropoff_lng: dropoffLng ?? null,
    })
    .select("id")
    .single();
  if (rideError || !ride) {
    console.warn("[chat] createRideFromConversation failed:", rideError?.message);
    return null;
  }
  await supabase
    .from("conversations")
    .update({ ride_id: ride.id, status: "COMPLETED" })
    .eq("id", conversationId);
  return ride.id as string;
}

/**
 * Subscribes to new messages in a conversation via Supabase Realtime.
 * Returns an unsubscribe function.
 */
export function subscribeToConversation(
  conversationId: string,
  callback: (msg: MessageRow) => void
): () => void {
  const channel = supabase
    .channel(`conv-${conversationId}-${Date.now()}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => callback(payload.new as MessageRow)
    )
    .subscribe();
  return () => supabase.removeChannel(channel);
}

// ─── Driver Verification Document Upload ──────────────────────────────────────

const VERIFICATION_DOCS_BUCKET = "verification-docs";

/**
 * Uploads a verification document (license front/back or vehicle registration)
 * to the 'verification-docs' Supabase Storage bucket and writes the public URL
 * back to the users table.
 *
 * @param kind  Column name in public.users (license_front_url | license_back_url | vehicle_reg_url)
 * @returns Public URL of the uploaded file.
 */
export async function uploadVerificationDoc(
  userId: string,
  file: File,
  kind: "license_front_url" | "license_back_url" | "vehicle_reg_url"
): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const filePath = `${userId}/${kind}.${ext}`;

  const { error: storageError } = await supabase.storage
    .from(VERIFICATION_DOCS_BUCKET)
    .upload(filePath, file, { upsert: true });

  if (storageError) throw new Error(storageError.message);

  const { data: urlData } = supabase.storage
    .from(VERIFICATION_DOCS_BUCKET)
    .getPublicUrl(filePath);

  const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

  const { error: dbError } = await supabase
    .from("users")
    .update({
      [kind]: publicUrl,
      docs_submitted_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (dbError) {
    const err = new Error(`File uploaded but DB update failed: ${dbError.message}`) as Error & { publicUrl: string };
    err.publicUrl = publicUrl;
    throw err;
  }

  return publicUrl;
}
