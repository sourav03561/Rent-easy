import type { CorsOptions } from "cors";
import { env } from "./env.js";

function getConfiguredOrigins() {
  return env.FRONTEND_URLS.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function isLocalDevOrigin(origin: string) {
  try {
    const url = new URL(origin);
    const isLocalHost = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    const isVitePort = Number(url.port) >= 5173 && Number(url.port) <= 5199;

    return isLocalHost && isVitePort;
  } catch {
    return false;
  }
}

export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin || getConfiguredOrigins().includes(origin) || isLocalDevOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked origin: ${origin}`));
  }
};
