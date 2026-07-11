export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          password: string;
          role: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          password: string;
          role: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          password?: string;
          role?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          email: string | null;
          phone: string | null;
          role: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          full_name?: string | null;
          email?: string | null;
          phone?: string | null;
          role?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          email?: string | null;
          phone?: string | null;
          role?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      listings: {
        Row: {
          id: string;
          owner_id: string;
          title: string;
          type: string;
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
        Insert: {
          id?: string;
          owner_id: string;
          title: string;
          type: string;
          city: string;
          address: string;
          price: number;
          amenities?: string[] | null;
          photos?: string[] | null;
          available?: boolean;
          vacant_rooms?: number;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          title?: string;
          type?: string;
          city?: string;
          address?: string;
          price?: number;
          amenities?: string[] | null;
          photos?: string[] | null;
          available?: boolean;
          vacant_rooms?: number;
          description?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      bookings: {
        Row: {
          id: string;
          listing_id: string;
          student_id: string;
          status: string;
          message: string | null;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          student_id: string;
          status?: string;
          message?: string | null;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          listing_id?: string;
          student_id?: string;
          status?: string;
          message?: string | null;
          completed_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          listing_id: string;
          student_id: string;
          rating: number;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          student_id: string;
          rating: number;
          comment?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          listing_id?: string;
          student_id?: string;
          rating?: number;
          comment?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
