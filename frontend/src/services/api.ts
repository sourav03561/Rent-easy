import axios from "axios";
import type { ApiResponse, Booking, Listing, ListingType, Profile, Review, User, UserRole } from "../types/api";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("renteasy_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export function getApiError(error: unknown) {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? error.message;
  }

  return error instanceof Error ? error.message : "Something went wrong";
}

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = LoginPayload & {
  name: string;
  role: Exclude<UserRole, "ADMIN">;
};

export type ListingPayload = {
  title: string;
  type: ListingType;
  city: string;
  address: string;
  price: number;
  amenities: string[];
  photos: string[];
  available: boolean;
  description?: string;
};

export const authApi = {
  register: (payload: RegisterPayload) =>
    api.post<ApiResponse<{ user: User; token: string }>>("/auth/register", payload),
  login: (payload: LoginPayload) =>
    api.post<ApiResponse<{ user: User; token: string }>>("/auth/login", payload)
};

export const usersApi = {
  me: () => api.get<ApiResponse<{ user: User; profile: Profile | null }>>("/users/me"),
  updateMe: (payload: { name?: string; fullName?: string; phone?: string; avatarUrl?: string }) =>
    api.patch<ApiResponse<{ profile: Profile }>>("/users/me", payload),
  all: () => api.get<ApiResponse<{ users: User[] }>>("/users"),
  updateRole: (id: string, role: UserRole) =>
    api.patch<ApiResponse<{ user: User }>>(`/users/${id}/role`, { role }),
  remove: (id: string) => api.delete<ApiResponse<{ id: string }>>(`/users/${id}`)
};

export const listingsApi = {
  search: (params: { city?: string; type?: ListingType | ""; minRent?: string; maxRent?: string; available?: string }) =>
    api.get<ApiResponse<{ listings: Listing[] }>>("/listings", { params }),
  details: (id: string) =>
    api.get<ApiResponse<{ listing: Listing; reviews: Review[] }>>(`/listings/${id}`),
  create: (payload: ListingPayload) => api.post<ApiResponse<{ listing: Listing }>>("/listings", payload),
  update: (id: string, payload: Partial<ListingPayload>) =>
    api.patch<ApiResponse<{ listing: Listing }>>(`/listings/${id}`, payload),
  remove: (id: string) => api.delete<ApiResponse<{ id: string }>>(`/listings/${id}`)
};

export const bookingsApi = {
  create: (payload: { listingId: string; message?: string }) =>
    api.post<ApiResponse<{ booking: Booking }>>("/bookings", payload),
  mine: () => api.get<ApiResponse<{ bookings: Booking[] }>>("/bookings/me"),
  cancel: (id: string) => api.patch<ApiResponse<{ booking: Booking }>>(`/bookings/${id}/cancel`),
  approve: (id: string) => api.patch<ApiResponse<{ booking: Booking }>>(`/bookings/${id}/approve`),
  reject: (id: string) => api.patch<ApiResponse<{ booking: Booking }>>(`/bookings/${id}/reject`)
};

export const ownersApi = {
  listings: () => api.get<ApiResponse<{ listings: Listing[] }>>("/owners/me/listings"),
  bookings: () => api.get<ApiResponse<{ bookings: Booking[] }>>("/owners/me/bookings")
};

export const reviewsApi = {
  create: (listingId: string, payload: { rating: number; comment?: string }) =>
    api.post<ApiResponse<{ review: Review }>>(`/listings/${listingId}/reviews`, payload),
  list: (listingId: string) => api.get<ApiResponse<{ reviews: Review[] }>>(`/listings/${listingId}/reviews`)
};

export const adminApi = {
  bookings: () => api.get<ApiResponse<{ bookings: Booking[] }>>("/admin/bookings"),
  reviews: () => api.get<ApiResponse<{ reviews: Review[] }>>("/admin/reviews"),
  removeReview: (id: string) => api.delete<ApiResponse<{ id: string }>>(`/admin/reviews/${id}`)
};
