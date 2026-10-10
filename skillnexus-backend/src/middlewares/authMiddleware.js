import jwt from "jsonwebtoken";
import User from "../models/User.js";

// ==================== PROTECT MIDDLEWARE ====================
// Ye check karta hai ki user logged in hai ya nahi
// Token verify karta hai, user database se fetch karta hai, req.user mein attach karta hai

export const protect = async (req, res, next) => {
  try {
    let token;

    // 1. Authorization header check karo
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      // Format: "Bearer eyJhbGc..."
      token = req.headers.authorization.split(" ")[1];
    }

    // 2. Token nahi mila?
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Please login to continue.",
      });
    }

    // 3. Token verify karo
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Database se user dhundo
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists.",
      });
    }

    // 5. User active hai?
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been suspended. Please contact support.",
      });
    }

    // 6. req.user mein user attach karo
    // Ab aage ke controllers mein req.user available hoga
    req.user = user;

    // 7. Agle middleware/controller ko call karo
    next();
  } catch (error) {
    console.error("Auth middleware error:", error.message);

    // JWT specific errors ke liye clean messages
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token. Please login again.",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired. Please login again.",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Not authorized. Please login to continue.",
    });
  }
};

// ==================== AUTHORIZE ROLES MIDDLEWARE ====================
// Ye check karta hai ki user ka role allowed roles mein hai ya nahi
// Use: authorizeRoles("admin") ya authorizeRoles("admin", "freelancer")

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // req.user protect middleware se aaya hoga
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Please login.",
      });
    }

    // Check karo user ka role allowed roles mein hai
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this resource.`,
      });
    }

    next();
  };
};
