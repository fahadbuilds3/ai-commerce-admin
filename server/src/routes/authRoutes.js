// import express from "express";
// import { register, login } from "../controllers/authController.js";
// import authMiddleware from "../middleware/authMiddleware.js";
// import {
//     register,
//     login,
//     getCurrentUser,
//   } from "../controllers/authController.js";

// const router = express.Router();

// // Authentication Routes

// // @route   POST /api/auth/register
// // @desc    Register a new user
// router.post("/register", register);

// // @route   POST /api/auth/login
// // @desc    Login user and return token
// router.post("/login", login);

// // User Routes

// // @route   GET /api/auth/me
// // @desc    Get current authenticated user
// // @access  Private
// router.get("/me", authMiddleware, getMe);

// export default router;

import express from "express";

import {
  register,
  login,
  getCurrentUser,
} from "../controllers/authController.js";

import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);

router.post("/login", login);

router.get("/me", protect, getCurrentUser);

export default router;