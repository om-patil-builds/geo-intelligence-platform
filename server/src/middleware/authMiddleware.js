import User from "../models/User.js";
import { verifyAccessToken } from "../utils/generateToken.js";

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      code: "NO_TOKEN",
      message: "Not authorized, no token provided",
    });
  }

  try {
    const decoded = verifyAccessToken(token);

    // Prevent using refresh token as access token
    if (decoded.type && decoded.type !== "access") {
      return res.status(401).json({
        success: false,
        code: "INVALID_TOKEN_TYPE",
        message: "Not authorized, invalid token type",
      });
    }

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        code: "USER_NOT_FOUND",
        message: "Not authorized, user not found",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    const isExpired = error.name === "TokenExpiredError";
    return res.status(401).json({
      success: false,
      code: isExpired ? "TOKEN_EXPIRED" : "INVALID_TOKEN",
      message: isExpired ? "Not authorized, token expired" : "Not authorized, token failed",
    });
  }
};

export default authMiddleware;
