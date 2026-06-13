import React, { useState, useEffect, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Image as ImageIcon, Trash2 } from "lucide-react";
import { uploadImage } from "../../api/uploadApi"; // path may need to be adjusted

// Modal form state shape
const initialFormState = {
  name: "",
  description: "",
  price: "",
  stock: "",
  sku: "",
  category: "",
  imageUrl: "",
  slug: "",
};

const validate = (values, mode, initialValues) => {
  const errors = {};
  const changed = (field) => {
    if (mode !== "edit") return true;
    const initial =
      typeof initialValues[field] === "undefined"
        ? ""
        : String(initialValues[field]);
    const current =
      typeof values[field] === "undefined"
        ? ""
        : String(values[field]);
    return initial !== current;
  };

  if (!values.name.trim()) errors.name = "Product name is required";
  else if (changed("name") && !values.name.trim()) errors.name = "Product name is required";

  if (!values.price && values.price !== 0) errors.price = "Valid price required";
  else if (isNaN(Number(values.price))) errors.price = "Valid price required";
  else if (Number(values.price) < 0) errors.price = "Price cannot be negative";

  if (!values.stock && values.stock !== 0) errors.stock = "Valid stock required";
  else if (isNaN(Number(values.stock))) errors.stock = "Valid stock required";
  else if (parseInt(values.stock, 10) < 0) errors.stock = "Stock cannot be negative";

  if (!values.category.trim()) errors.category = "Category required";
  if (!values.sku.trim()) errors.sku = "SKU required";

  if (
    values.imageUrl &&
    changed("imageUrl") &&
    !/^https?:\/\/.+\.(jpeg|jpg|png|webp|gif|svg|)/i.test(values.imageUrl)
  ) {
    errors.imageUrl = "Image URL must be a valid image address";
  }
  return errors;
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.98, y: 40 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.2 } },
  exit: { opacity: 0, scale: 0.97, y: 35, transition: { duration: 0.18 } },
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.16 } },
  exit: { opacity: 0, transition: { duration: 0.09 } },
};

/**
 * ImageDropzone: Cloudinary upload, drag-drop, file picker, progress, preview.
 * imageUrl: comes from ProductModal form state. setImageUrl: sets ProductModal form state.
 */
function ImageDropzone({
  imageUrl,
  setImageUrl,
  uploadProgress,
  setUploadProgress,
  disabled,
  setTouched,
  error,
}) {
  const [dragActive, setDragActive] = useState(false);
  const [localPreview, setLocalPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Clean local preview if product imageUrl is cleared.
    if (!imageUrl && localPreview) {
      URL.revokeObjectURL(localPreview);
      setLocalPreview(null);
    }
    // Show preview for form imageUrl if available, otherwise for localPreview.
  }, [imageUrl]); // eslint-disable-line

  const handleRemoveImage = () => {
    setImageUrl(""); // sets ProductModal's form.imageUrl also
    setLocalPreview(null);
    setUploadProgress(null);
    setUploading(false);
    setTouched && setTouched((prev) => ({ ...prev, imageUrl: true }));
  };

  // Upload to Cloudinary: pass url to parent setter and log for debugging
  const handleUpload = async (file) => {
    if (!file) return;
    setLocalPreview(URL.createObjectURL(file));
    setUploadProgress(0);
    setUploading(true);

    try {
      const url = await uploadImage(file, {
        onProgress: (percent) => setUploadProgress(percent),
      });
      
      setImageUrl(url);
      
      setUploading(false);
      setUploadProgress(null);
      
      console.log("Cloudinary uploaded imageUrl:", url);
      
    } catch (err) {
      setUploading(false);
      setUploadProgress(null);
      alert("Image upload failed. Please try again.");
      handleRemoveImage();
    }
    setTouched && setTouched((prev) => ({ ...prev, imageUrl: true }));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (disabled) return;
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file && /^image\//.test(file.type)) {
      handleUpload(file);
    } else {
      alert("Only image files are supported.");
    }
  };

  const openFileDialog = () => {
    if (!disabled && fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileInput = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file && /^image\//.test(file.type)) {
      handleUpload(file);
    } else {
      alert("Only image files are supported.");
    }
  };

  // Keep preview as either external imageUrl or localPreview (form field always wins)
  const previewUrl = imageUrl || localPreview;

  return (
    <div>
      <label
        htmlFor="product-image-upload"
        className="block text-slate-700 dark:text-slate-300 mb-1 text-sm font-medium"
      >
        Product Image
      </label>
      <div
        className={`flex flex-col items-center justify-center w-full px-3 py-6 border-2 border-dashed rounded-lg relative
          ${
            dragActive
              ? "border-emerald-400 bg-emerald-900/10"
              : error
              ? "border-red-500"
              : "border-slate-300 dark:border-slate-600"
          }
          bg-slate-100 dark:bg-slate-800 hover:border-emerald-400 transition cursor-pointer min-h-[144px]`}
        tabIndex={0}
        aria-disabled={disabled}
        onClick={openFileDialog}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!disabled) setDragActive(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragActive(false);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!disabled) setDragActive(true);
        }}
        onDrop={handleDrop}
        role="button"
        aria-label="Image uploader"
      >
        <input
          id="product-image-upload"
          name="imageUrl"
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          ref={fileInputRef}
          onChange={handleFileInput}
          disabled={disabled}
          tabIndex={-1}
        />
        {previewUrl ? (
          <div className="flex flex-col items-center w-full">
            <img
              src={previewUrl}
              alt="Product"
              className="object-contain rounded-lg max-h-40 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 w-full max-w-[220px] mx-auto"
            />
            <button
              type="button"
              title="Remove image"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveImage();
              }}
              className="btn btn-danger mt-3 h-8 rounded-lg px-2 text-xs"
              tabIndex={0}
              disabled={disabled || uploading}
            >
              <Trash2 className="w-3.5 h-3.5 opacity-80" />
              Remove
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <ImageIcon className="w-10 h-10 mb-2 text-slate-500 dark:text-slate-400/80" />
            <div className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-1 text-center select-none">
              Drag and drop, or <span className="text-emerald-700 underline dark:text-emerald-400">browse</span> to upload
            </div>
            <div className="text-slate-500 dark:text-slate-400 text-xs select-none">
              PNG, JPG, WebP, GIF supported. 5MB max.
            </div>
          </div>
        )}

        {(uploading || uploadProgress !== null) && (
          <div className="absolute bottom-2 left-0 right-0 px-4">
            <div className="w-full bg-zinc-700 rounded-full h-2 mt-3">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all"
                style={{ width: `${uploadProgress ?? 0}%` }}
              />
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 text-center mt-1 flex items-center justify-center gap-1">
              <Loader2 className="animate-spin w-4 h-4" />
              Uploading&hellip; {uploadProgress ?? 0}%
            </div>
          </div>
        )}
      </div>
      {error && (
        <span className="text-xs text-red-500 mt-1 block">{error}</span>
      )}
    </div>
  );
}

// --- ProductModal ---
const ProductModal = ({
  open,
  onClose,
  onCreate,
  loading = false,
  initialValues = initialFormState,
  mode = "create",
}) => {
  // Form state, reset on open/editing another product
  const [form, setForm] = useState(() => {
    return open
      ? mode === "edit"
        ? {
            ...initialFormState,
            ...(initialValues || {}),
          }
        : initialFormState
      : initialFormState;
  });

  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitAttempt, setSubmitAttempt] = useState(0);

  // Image upload progress (number|null)
  const [uploadProgress, setUploadProgress] = useState(null);

  const prevOpen = useRef(open);
  const prevInitialValues = useRef(initialValues);

  // On modal open or editing a new product, reset state.
  useEffect(() => {
    if (!open) {
      setForm(initialFormState);
      setTouched({});
      setSubmitting(false);
      setSubmitAttempt(0);
      setUploadProgress(null);
    } else if (
      open &&
      (!prevOpen.current ||
        prevInitialValues.current !== initialValues)
    ) {
      setForm({
        ...initialFormState,
        ...(mode === "edit" && initialValues ? initialValues : {}),
      });
      setTouched({});
      setSubmitting(false);
      setSubmitAttempt(0);
      setUploadProgress(null);
    }
    prevOpen.current = open;
    prevInitialValues.current = initialValues;
  }, [open, initialValues, mode]);

  const isEditMode = mode === "edit";
  const errors = validate(form, mode, initialValues);
  const hasErrors = Object.keys(errors).length > 0;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  // Synchronized handler for Cloudinary imageUrl after upload
  const handleImageUrlChange = (url) => {
    // Log every time we set an uploaded image URL for debugging
    // eslint-disable-next-line no-console
    if (url) console.log("ProductModal receives uploaded imageUrl:", url);
    setForm((prev) => ({ ...prev, imageUrl: url || "" }));
  };

  const handleClose = () => {
    if (!loading && !submitting && uploadProgress === null) {
      onClose && onClose();
    }
  };

  // Main submit: ensure upload is completed, imageUrl in payload, and log
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setTouched({
        name: true,
        price: true,
        stock: true,
        sku: true,
        category: true,
        description: true,
        imageUrl: true,
        slug: true,
      });

      if (uploadProgress !== null) {
        setSubmitAttempt((x) => x + 1);
        alert("Please wait for image upload to finish.");
        return;
      }

      const currentErrors = validate(form, mode, initialValues);
      if (Object.keys(currentErrors).length > 0) {
        setSubmitAttempt((x) => x + 1);
        return;
      }

      const payload = {
        ...form,
        // Always provide the imageUrl - synced from Cloudinary/upload above
        imageUrl: form.imageUrl, // explicit, for clarity and safety
        slug:
          (!form.slug || form.slug === "")
            ? (form.name || "").toLowerCase().replace(/\s+/g, "-")
            : form.slug,
      };

      // Sync/Debug: log payload before creation
      // eslint-disable-next-line no-console
      console.log("ProductModal will submit payload:", payload);

      setSubmitting(true);
      try {
        await onCreate(payload);
        setSubmitting(false);
        handleClose();
      } catch (err) {
        setSubmitting(false);
      }
    },
    [form, mode, onCreate, loading, handleClose, uploadProgress, initialValues]
  );

  // Responsive modal/layout styles using Tailwind CSS
  // Scrollable modal content zone for mobile and overflow safety
  if (!open) return null;
  return (
    <AnimatePresence mode="wait">
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center touch-none"
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={overlayVariants}
        key="product-modal-overlay"
        style={{ overscrollBehavior: "none" }}
      >
        <motion.div
          className="absolute inset-0 bg-black/80 backdrop-blur-lg z-[101]"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={overlayVariants}
          onClick={handleClose}
          aria-label="Close modal"
        />
        <motion.div
          className={`
            relative z-[102]
            bg-white dark:bg-slate-900
            border border-slate-200 dark:border-slate-700
            shadow-2xl
            rounded-t-2xl sm:rounded-xl
            flex flex-col
            w-full
            sm:w-[500px]
            md:w-[520px]
            max-w-full
            mx-auto
            min-h-[60vh] max-h-[98dvh] sm:max-h-[90vh]
            px-3 sm:px-7 py-6 sm:py-8
            overflow-hidden
          `}
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          key="product-modal-content"
        >
          <button
            onClick={handleClose}
            className="icon-button absolute right-3 top-2.5 sm:right-5 sm:top-4"
            aria-label="Close"
            type="button"
            tabIndex={0}
            disabled={loading || submitting || uploadProgress !== null}
          >
            <X className="w-5 h-5" />
          </button>
          {/* Scroll zone for modal content */}
          <div className="flex flex-col h-full overflow-y-auto overflow-x-hidden
                          sm:max-h-[82vh] max-h-[calc(98dvh-24px)]
                          pr-1 touch-pan-y">
            <div className="flex-shrink-0">
              <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2 text-slate-950 dark:text-white">
                {isEditMode ? "Edit Product" : "Create Product"}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-4 sm:mb-6 text-sm">
                {isEditMode
                  ? "Update details for this product."
                  : "Fill out the details of your new product."}
              </p>
            </div>
            <form onSubmit={handleSubmit} autoComplete="off" className="w-full flex flex-col flex-1">
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                {/* Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-slate-700 dark:text-slate-300 mb-1 text-[15px] font-medium"
                  >
                    Name<span className="ml-1 text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoFocus
                    disabled={loading || submitting || (uploadProgress !== null)}
                    className={`control-input mt-1 rounded-lg text-base
                      ${errors.name && touched.name
                        ? "border-red-500 focus:border-red-500"
                        : ""}`}
                    value={form.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="e.g. T-shirt"
                    autoComplete="off"
                  />
                  {errors.name && touched.name && (
                    <span className="text-xs text-red-500 mt-0.5 block">
                      {errors.name}
                    </span>
                  )}
                </div>
                {/* Description */}
                <div>
                  <label
                    htmlFor="description"
                    className="block text-slate-700 dark:text-slate-300 mb-1 text-[15px] font-medium"
                  >
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows="3"
                    disabled={loading || submitting || (uploadProgress !== null)}
                    className="control-textarea mt-1 resize-none rounded-lg text-base"
                    value={form.description}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Product description"
                  />
                </div>
                {/* Price */}
                <div>
                  <label
                    htmlFor="price"
                    className="block text-slate-700 dark:text-slate-300 mb-1 text-[15px] font-medium"
                  >
                    Price ($)<span className="ml-1 text-red-500">*</span>
                  </label>
                  <input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    disabled={loading || submitting || (uploadProgress !== null)}
                    className={`control-input mt-1 rounded-lg text-base
                      ${errors.price && touched.price
                        ? "border-red-500 focus:border-red-500"
                        : ""}`}
                    value={form.price}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="19.99"
                  />
                  {errors.price && touched.price && (
                    <span className="text-xs text-red-500 mt-0.5 block">{errors.price}</span>
                  )}
                </div>
                {/* Stock */}
                <div>
                  <label
                    htmlFor="stock"
                    className="block text-slate-700 dark:text-slate-300 mb-1 text-[15px] font-medium"
                  >
                    Stock<span className="ml-1 text-red-500">*</span>
                  </label>
                  <input
                    id="stock"
                    name="stock"
                    type="number"
                    min="0"
                    disabled={loading || submitting || (uploadProgress !== null)}
                    className={`control-input mt-1 rounded-lg text-base
                      ${errors.stock && touched.stock
                        ? "border-red-500 focus:border-red-500"
                        : ""}`}
                    value={form.stock}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="0"
                  />
                  {errors.stock && touched.stock && (
                    <span className="text-xs text-red-500 mt-0.5 block">{errors.stock}</span>
                  )}
                </div>
                {/* SKU */}
                <div>
                  <label
                    htmlFor="sku"
                    className="block text-slate-700 dark:text-slate-300 mb-1 text-[15px] font-medium"
                  >
                    SKU<span className="ml-1 text-red-500">*</span>
                  </label>
                  <input
                    id="sku"
                    name="sku"
                    type="text"
                    disabled={loading || submitting || (uploadProgress !== null)}
                    className={`control-input mt-1 rounded-lg text-base
                      ${errors.sku && touched.sku
                        ? "border-red-500 focus:border-red-500"
                        : ""}`}
                    value={form.sku}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="e.g. SKU-12345"
                  />
                  {errors.sku && touched.sku && (
                    <span className="text-xs text-red-500 mt-0.5 block">{errors.sku}</span>
                  )}
                </div>
                {/* Category */}
                <div>
                  <label
                    htmlFor="category"
                    className="block text-slate-700 dark:text-slate-300 mb-1 text-[15px] font-medium"
                  >
                    Category<span className="ml-1 text-red-500">*</span>
                  </label>
                  <input
                    id="category"
                    name="category"
                    type="text"
                    disabled={loading || submitting || (uploadProgress !== null)}
                    className={`control-input mt-1 rounded-lg text-base
                      ${errors.category && touched.category
                        ? "border-red-500 focus:border-red-500"
                        : ""}`}
                    value={form.category}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="e.g. Apparel"
                  />
                  {errors.category && touched.category && (
                    <span className="text-xs text-red-500 mt-0.5 block">{errors.category}</span>
                  )}
                </div>
                {/* Modern Cloudinary Image Upload Dropzone */}
                <ImageDropzone
                  imageUrl={form.imageUrl}
                  setImageUrl={handleImageUrlChange}
                  uploadProgress={uploadProgress}
                  setUploadProgress={setUploadProgress}
                  disabled={loading || submitting}
                  setTouched={setTouched}
                  error={touched.imageUrl && errors.imageUrl}
                />
                {/* Slug not shown in form, managed by submit logic */}
              </div>
              <div className="flex items-center justify-end mt-6 sm:mt-7 gap-2 sm:gap-3 pb-1 sm:pb-0">
                <button
                  type="button"
                  className="btn btn-secondary rounded-lg"
                  onClick={handleClose}
                  disabled={loading || submitting || uploadProgress !== null}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary relative rounded-lg px-5"
                  disabled={loading || submitting || uploadProgress !== null}
                >
                  {(loading || submitting || uploadProgress !== null) && (
                    <Loader2 className="animate-spin w-5 h-5" />
                  )}
                  {isEditMode ? "Update Product" : "Create Product"}
                </button>
              </div>
              {submitAttempt > 0 && hasErrors && (
                <div className="mt-3 text-xs text-red-600 dark:text-red-400 sm:mt-4">
                  Please fix the highlighted errors above and resubmit.
                </div>
              )}
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

ProductModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  initialValues: PropTypes.shape({
    name: PropTypes.string,
    description: PropTypes.string,
    price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    stock: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    sku: PropTypes.string,
    category: PropTypes.string,
    imageUrl: PropTypes.string,
    slug: PropTypes.string,
  }),
  mode: PropTypes.oneOf(["create", "edit"]),
};

export default ProductModal;
