import bcrypt from "bcryptjs";
import User from "../models/User.js";
import RefreshToken from "../models/RefreshToken.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  getRefreshTokenCookieOptions,
  REFRESH_TOKEN_EXPIRY_MS,
} from "../utils/generateToken.js";
import asyncHandler from "../utils/asyncHandler.js";

/**
 * Helper to generate tokens, store rotating refresh token in DB,
 * set httpOnly cookie, and construct response payload.
 */
const issueTokenPair = async (user, req, res, statusCode = 200, message = "Success") => {
  const accessToken = generateAccessToken(user._id);
  const { token: refreshToken, jti } = generateRefreshToken(user._id);

  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);
  const clientIp = req.ip || req.headers["x-forwarded-for"] || "";
  const userAgent = req.headers["user-agent"] || "";

  // Persist refresh token in MongoDB with TTL
  await RefreshToken.create({
    token: refreshToken,
    user: user._id,
    jti,
    expiresAt,
    createdByIp: String(clientIp),
    userAgent: String(userAgent),
  });

  // Set httpOnly secure cookie
  res.cookie("refreshToken", refreshToken, getRefreshTokenCookieOptions());

  res.status(statusCode).json({
    success: true,
    message,
    token: accessToken,
    refreshToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  });
};

export const registerUser = asyncHandler(async (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!name || !email || !password) {
    const error = new Error("name, email and password are required");
    error.statusCode = 400;
    throw error;
  }

  if (password.length < 6) {
    const error = new Error("password must be at least 6 characters");
    error.statusCode = 400;
    throw error;
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    const error = new Error("User already exists");
    error.statusCode = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hashedPassword });

  await issueTokenPair(user, req, res, 201, "User registered successfully");
});

export const loginUser = asyncHandler(async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!email || !password) {
    const error = new Error("email and password are required");
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findOne({ email });

  if (!user) {
    const error = new Error("Invalid credentials");
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    const error = new Error("Invalid credentials");
    error.statusCode = 401;
    throw error;
  }

  await issueTokenPair(user, req, res, 200, "Login successful");
});

/**
 * Handle rotating refresh token:
 * 1. Read token from cookie or request body
 * 2. Verify token signature
 * 3. Check for reuse (revoked token reuse triggers family revocation)
 * 4. Revoke used token & issue a fresh token pair
 */
export const refreshTokenUser = asyncHandler(async (req, res) => {
  const incomingToken = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingToken) {
    return res.status(401).json({
      success: false,
      code: "NO_REFRESH_TOKEN",
      message: "No refresh token provided",
    });
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(incomingToken);
  } catch (error) {
    // If the token is cryptographically invalid or expired
    res.clearCookie("refreshToken", getRefreshTokenCookieOptions());
    return res.status(401).json({
      success: false,
      code: "EXPIRED_REFRESH_TOKEN",
      message: "Refresh token is invalid or expired. Please sign in again.",
    });
  }

  // Lookup the refresh token in MongoDB
  const tokenDoc = await RefreshToken.findOne({ token: incomingToken });

  if (!tokenDoc) {
    res.clearCookie("refreshToken", getRefreshTokenCookieOptions());
    return res.status(401).json({
      success: false,
      code: "UNKNOWN_REFRESH_TOKEN",
      message: "Refresh token not recognized. Please sign in again.",
    });
  }

  // REUSE DETECTION: If token is already revoked, an attacker or compromised party
  // might be trying to reuse a previously rotated token!
  if (tokenDoc.isRevoked) {
    // Revoke all refresh tokens for this user to protect account
    await RefreshToken.updateMany(
      { user: tokenDoc.user },
      { isRevoked: true, revokedAt: new Date() }
    );
    res.clearCookie("refreshToken", getRefreshTokenCookieOptions());
    return res.status(403).json({
      success: false,
      code: "REUSED_REFRESH_TOKEN",
      message: "Suspicious token reuse detected. All active sessions have been revoked for your security.",
    });
  }

  const user = await User.findById(tokenDoc.user).select("-password");
  if (!user) {
    res.clearCookie("refreshToken", getRefreshTokenCookieOptions());
    return res.status(401).json({
      success: false,
      code: "USER_NOT_FOUND",
      message: "User associated with token no longer exists.",
    });
  }

  // ROTATION: Revoke current token and replace with new one
  const newAccessToken = generateAccessToken(user._id);
  const { token: newRefreshToken, jti: newJti } = generateRefreshToken(user._id);

  tokenDoc.isRevoked = true;
  tokenDoc.revokedAt = new Date();
  tokenDoc.replacedByToken = newRefreshToken;
  await tokenDoc.save();

  // Create new active RefreshToken in DB
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);
  const clientIp = req.ip || req.headers["x-forwarded-for"] || "";
  const userAgent = req.headers["user-agent"] || "";

  await RefreshToken.create({
    token: newRefreshToken,
    user: user._id,
    jti: newJti,
    expiresAt,
    createdByIp: String(clientIp),
    userAgent: String(userAgent),
  });

  // Set rotated httpOnly cookie
  res.cookie("refreshToken", newRefreshToken, getRefreshTokenCookieOptions());

  res.status(200).json({
    success: true,
    message: "Token refreshed successfully",
    token: newAccessToken,
    refreshToken: newRefreshToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  });
});

/**
 * Logout: Revoke the active refresh token in database and clear the cookie
 */
export const logoutUser = asyncHandler(async (req, res) => {
  const incomingToken = req.cookies?.refreshToken || req.body?.refreshToken;

  if (incomingToken) {
    await RefreshToken.updateOne(
      { token: incomingToken },
      { isRevoked: true, revokedAt: new Date() }
    );
  }

  res.clearCookie("refreshToken", getRefreshTokenCookieOptions());

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
    },
  });
});
