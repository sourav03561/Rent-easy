import cors from "cors";
import express from "express";
import helmet from "helmet";
import { successResponse } from "./common/api-response.js";
import { corsOptions } from "./config/cors.js";
import { supabase } from "./config/supabase.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { adminRouter } from "./modules/admin/admin.routes.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { bookingsRouter } from "./modules/bookings/bookings.routes.js";
import { listingsRouter } from "./modules/listings/listings.routes.js";
import { ownersRouter } from "./modules/owners/owners.routes.js";
import { reviewsRouter } from "./modules/reviews/reviews.routes.js";
import { usersRouter } from "./modules/users/users.routes.js";

export const app = express();

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", async (_req, res, next) => {
  try {
    const { error } = await supabase.from("profiles").select("id").limit(1);

    if (error) {
      throw error;
    }

    res.json(successResponse("API and Supabase are healthy", { database: "connected" }));
  } catch (error) {
    next(error);
  }
});

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/listings", listingsRouter);
app.use("/api/listings/:listingId/reviews", reviewsRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/owners", ownersRouter);
app.use("/api/admin", adminRouter);

app.use(notFoundHandler);
app.use(errorHandler);
