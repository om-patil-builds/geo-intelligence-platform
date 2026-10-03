import rateLimit from "express-rate-limit";

/**
 * Stricter rate limiter for sensitive authentication endpoints (login, register)
 * to prevent brute-force attacks and credential stuffing.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 25, // limit each IP to 25 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: "TOO_MANY_AUTH_ATTEMPTS",
    message: "Too many authentication attempts from this IP, please try again after 15 minutes",
  },
});

export default authRateLimiter;
