import rateLimit from "express-rate-limit";

// max 10 requesta u 5 minuta po IP adresi
export const rateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  message: { message: "Too many requests, please try again later." }
});