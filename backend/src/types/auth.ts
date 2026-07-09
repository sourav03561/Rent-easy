export type UserRole = "STUDENT" | "OWNER" | "ADMIN";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};
