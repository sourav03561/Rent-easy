import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";
import type { AuthUser } from "../types/auth.js";

type TokenPayload = {
  sub: string;
  email: string;
  role: AuthUser["role"];
};

export function signToken(user: AuthUser) {
  const payload: TokenPayload = {
    sub: user.id,
    email: user.email,
    role: user.role
  };

  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"]
  };

  return jwt.sign(payload, env.JWT_SECRET, options);
}

export function verifyToken(token: string) {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
}
