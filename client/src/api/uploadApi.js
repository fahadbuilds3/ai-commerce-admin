/**
 * Upload API Service
 * Handles image uploads for the ecommerce admin dashboard.
 * Clean, scalable, and production-ready.
 */

import apiClient from "./axios";

/**
 * Upload an image to the server.
 * @param {File} file - The image file to upload.
 * @returns {Promise<string>} - Resolves to the URL of the uploaded image.
 * @throws {Error} - Throws error if upload fails.
 */
export async function uploadImage(file) {
  if (!(file instanceof File)) {
    throw new Error("A valid image file is required for upload.");
  }

  // Temporary debug: log the selected file
  console.log("[uploadApi] Selected file:", file);

  const formData = new FormData();
  formData.append("image", file);

  // Temporary debug: log FormData entries
  for (const [key, value] of formData.entries()) {
    // File objects do not stringify well; show filename if possible
    console.log(`[uploadApi] FormData entry: ${key}`, value && value.name ? value.name : value);
  }

  try {
    // POST to the correct endpoint; /upload (according to requirements)
    const response = await apiClient.post("/upload", formData, {
      headers: {
        // NOTE: Let the browser set the correct boundary for multipart form data
        // (axios will set it correctly if you don't specify Content-Type)
        // "Content-Type": "multipart/form-data",
      },
    });

    // Temporary debug: log API response
    console.log("[uploadApi] API response:", response);

    // Adjust to expected backend response shape
    // (assuming success:true and imageUrl per server code)
    if (response.data && response.data.success && response.data.imageUrl) {
      return response.data.imageUrl;
    }

    // More debug output for unexpected response
    console.error("[uploadApi] Unexpected response structure:", response.data);

    throw new Error(
      response.data?.error || "Unexpected upload response structure."
    );
  } catch (err) {
    // Temporary debug: log errors
    console.error("[uploadApi] Upload error:", err);

    let message = "Image upload failed";
    if (err.response && err.response.data && err.response.data.error) {
      message = err.response.data.error;
    } else if (err.message) {
      message = err.message;
    }
    throw new Error(message);
  }
}