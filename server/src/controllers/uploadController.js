import { v2 as cloudinary } from "cloudinary";
import multer from "multer";

// Configure Multer storage (memory for direct buffer upload)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Cloudinary configuration (ensure environment variables are set)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Async wrapper for Express routes
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// [POST] /api/upload
export const uploadImage = [
  upload.single("image"),
  asyncHandler(async (req, res) => {
    try {
      // Log req.file for debugging
      console.log("[/api/upload] req.file:", req.file);
      if (!req.file || !req.file.buffer) {
        console.warn("[/api/upload] No file uploaded.");
        return res.status(400).json({
          success: false,
          message: "No file uploaded.",
        });
      }

      // Upload to Cloudinary from buffer
      const uploaded = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "products",
            resource_type: "image",
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        );

        stream.end(req.file.buffer);
      });

      // Log Cloudinary upload result
      console.log("[/api/upload] Cloudinary result:", uploaded);

      if (!uploaded || !uploaded.secure_url) {
        return res.status(500).json({
          success: false,
          message: "Upload failed.",
        });
      }

      return res.status(200).json({
        success: true,
        imageUrl: uploaded.secure_url,
      });
    } catch (error) {
      // Log errors thrown
      console.error("[/api/upload] Error:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "An unexpected error occurred during upload.",
      });
    }
  }),
];