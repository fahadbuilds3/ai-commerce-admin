import express from "express";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js"; // assumes the default export is the configured instance
import { uploadImage } from "../controllers/uploadController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/authorize.js";

const router = express.Router();
router.use(authMiddleware);
router.use(authorizeRoles("ADMIN", "MANAGER"));

// Configure multer-storage-cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "ecommerce/products",
    resource_type: "image",
    use_filename: true,
    unique_filename: true,
    allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
  },
});

// Multer upload middleware with file limits and error handling
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "Only image files are allowed"));
    }
  },
});

/**
 * @route POST /api/upload/
 * @desc Upload a single image to Cloudinary
 * @access Private/Admin
 */
router.post("/", (req, res) => {
  upload.single("image")(req, res, function (err) {
    if (err) {
      console.error("MULTER/CLOUDINARY ERROR:", err);

      return res.status(500).json({
        message: "Internal server error",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded",
      });
    }

    return res.status(201).json({
      success: true,
      imageUrl: req.file.path,
    });
  });
});

export default router;
