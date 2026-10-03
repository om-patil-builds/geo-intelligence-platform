import jwt from "jsonwebtoken";
import crypto from "crypto";

export const ACCESS_TOKEN_EXPIRY = process.env.JWT_ACCESS_EXPIRES_IN || "15m";
export const REFRESH_TOKEN_EXPIRY = process.env.JWT_REFRESH_EXPIRES_IN || "7d";
export const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

export const getAccessTokenSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required");
  }
  return process.env.JWT_SECRET;
};

export const getRefreshTokenSecret = () => {
  return process.env.JWT_REFRESH_SECRET || `${getAccessTokenSecret()}_refresh`;
};

/**
 * Generate a short-lived access token (default 15m)
 */
export const generateAccessToken = (userId) => {
  return jwt.sign(
    { id: userId, type: "access" },
    getAccessTokenSecret(),
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
};

/**
 * Generate a long-lived rotating refresh token (default 7d)
 */
export const generateRefreshToken = (userId, jti = crypto.randomUUID()) => {
  const token = jwt.sign(
    { id: userId, jti, type: "refresh" },
    getRefreshTokenSecret(),
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
  return { token, jti };
};

/**
 * Verify an access token
 */
export const verifyAccessToken = (token) => {
  return jwt.verify(token, getAccessTokenSecret());
};

/**
 * Verify a refresh token
 */
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, getRefreshTokenSecret());
};

/**
 * Cookie configuration for refresh tokens
 */
export const getRefreshTokenCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: REFRESH_TOKEN_EXPIRY_MS,
    path: "/",
  };
};

export default generateAccessToken;
