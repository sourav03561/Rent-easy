export type UserRole = "STUDENT" | "OWNER" | "ADMIN";

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  errors?: unknown;
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at?: string;
};

export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: UserRole | null;
  avatar_url: string | null;
  created_at: string;
};

export type ListingType = "PG" | "HOSTEL" | "MESS";

export type Listing = {
  id: string;
  owner_id: string;
  title: string;
  type: ListingType;
  city: string;
  address: string;
  price: number;
  amenities: string[] | null;
  photos: string[] | null;
  available: boolean;
  vacant_rooms: number;
  description: string | null;
  created_at: string;
};

export type BookingStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "COMPLETED";

export type Booking = {
  id: string;
  listing_id: string;
  student_id: string;
  status: BookingStatus;
  message: string | null;
  completed_at: string | null;
  created_at: string;
};

export type Review = {
  id: string;
  listing_id: string;
  student_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
};
