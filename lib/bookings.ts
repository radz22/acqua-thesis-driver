import { API_URL } from "@/constants";
import { authClient } from "@/lib/auth-client";

export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "READY_TO_DELIVER";

export type Booking = {
  id: string;
  gallons: number;
  address: string;
  latitude: number;
  longitude: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: BookingStatus;
  customerName: string;
  customerEmail: string;
  driverId: string | null;
  driverName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BookingPage = {
  bookings: Booking[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

type ErrorBody = {
  error?: string;
  message?: string;
};

async function bookingFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  const cookie = authClient.getCookie();
  if (cookie) headers.set("cookie", cookie);

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    let message = `Request failed: ${response.status}`;
    try {
      const body = (await response.json()) as ErrorBody;
      message = body.message ?? body.error ?? message;
    } catch {
      // The status line is enough when the body is not JSON.
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}

export function listDriverBookings(params: { page?: number; limit?: number } = {}) {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  const query = search.toString();
  return bookingFetch<BookingPage>(`/api/driver/bookings${query ? `?${query}` : ""}`);
}

export function getDriverBooking(id: string) {
  return bookingFetch<Booking>(`/api/driver/bookings/${encodeURIComponent(id)}`);
}

export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  CANCELLED: "Cancelled",
  READY_TO_DELIVER: "Ready to deliver",
};
