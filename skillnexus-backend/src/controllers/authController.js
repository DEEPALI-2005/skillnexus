import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";  
// ==================== REGISTER USER ====================
// POST /api/auth/register
// Public route

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // ==================== VALIDATION ====================

    // 1. Required fields check karo
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email and password",
      });
    }

    // 2. Email format check karo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    // 3. Password length check karo
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // 4. Role validation (agar provided hai)
    const allowedRoles = ["client", "freelancer"];
    if (role && !allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role must be either client or freelancer",
      });
    }

    // ==================== DUPLICATE CHECK ====================

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // ==================== CREATE USER ====================

    const user = await User.create({
      name,
      email,
      password,
      role: role || "client",
    });

    // ==================== RESPONSE ====================

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Register error:", error.message);

    // Duplicate key error (MongoDB ka apna error)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};
// ==================== LOGIN USER ====================
// POST /api/auth/login
// Public route

export const loginUser = async (req, res) => {
    try {
      const { email, password } = req.body;
  
      // ==================== VALIDATION ====================
  
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Please provide email and password",
        });
      }
  
      // ==================== FIND USER ====================
      // .select("+password") zaroori hai kyunki password field default select: false hai
  
      const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }
  
      // ==================== CHECK ACTIVE ====================
  
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: "Your account has been suspended. Please contact support.",
        });
      }
  
      // ==================== MATCH PASSWORD ====================
  
      const isMatch = await user.matchPassword(password);
  
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }
  
      // ==================== GENERATE TOKEN ====================
  
      const token = generateToken(user._id, user.role);
  
      // ==================== RESPONSE ====================
  
      res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          token: token,
        },
      });
    } catch (error) {
      console.error("Login error:", error.message);
      res.status(500).json({
        success: false,
        message: "Server error. Please try again later.",
      });
    }
  };
// ==================== GET CURRENT USER ====================
// GET /api/auth/me
// Private route (login required)

export const getMe = async (req, res) => {
    try {
      // req.user protect middleware se aaya hai
      const user = req.user;
  
      res.status(200).json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          location: user.location,
          avatar: user.avatar,
          isEmailVerified: user.isEmailVerified,
          isActive: user.isActive,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      console.error("Get me error:", error.message);
      res.status(500).json({
        success: false,
        message: "Server error. Please try again later.",
      });
    }
  };