import React, { useState } from "react";
import PropTypes from "prop-types";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";

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

const validate = (values) => {
  const errors = {};
  if (!values.name.trim()) errors.name = "Product name is required";
  if (!values.price || isNaN(Number(values.price))) errors.price = "Valid price required";
  else if (Number(values.price) < 0) errors.price = "Price cannot be negative";
  if (!values.stock || isNaN(Number(values.stock))) errors.stock = "Valid stock required";
  else if (parseInt(values.stock, 10) < 0) errors.stock = "Stock cannot be negative";
  if (!values.category.trim()) errors.category = "Category required";
  if (!values.sku.trim()) errors.sku = "SKU required";
  if (values.imageUrl && !/^https?:\/\/.+\.(jpeg|jpg|png|webp|gif|svg)$/i.test(values.imageUrl))
    errors.imageUrl = "Image URL must be a valid image address";
  return errors;
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.98, y: 40 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.20 } },
  exit: { opacity: 0, scale: 0.97, y: 35, transition: { duration: 0.18 } },
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.16 } },
  exit: { opacity: 0, transition: { duration: 0.09 } },
};

const ProductModal = ({
  open,
  onClose,
  onCreate,
  loading = false,
  initialValues = initialFormState,
}) => {
  const [form, setForm] = useState(initialValues);
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (!open) {
      setForm(initialValues);
      setTouched({});
      setSubmitting(false);
    }
  }, [open, initialValues]);

  const errors = validate(form);
  const hasErrors = Object.keys(errors).length > 0;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlur = (e) => {
    setTouched((prev) => ({ ...prev, [e.target.name]: true }));
  };

  const handleSubmit = async (e) => {
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
    // Log the form data (formData)
    console.log(form);
    if (!hasErrors) {
      // Log submitting before API call
      console.log("Submitting...");
      setSubmitting(true);
      try {
        const payload = {
          ...form,
          slug: form.name
            .toLowerCase()
            .replace(/\s+/g, "-"),
        };
        await onCreate(payload);
        setSubmitting(false);
        onClose();
      } catch (err) {
        setSubmitting(false);
      }
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={overlayVariants}
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-lg"
            onClick={onClose}
            aria-label="Close modal"
          />
          <motion.div
            className="relative bg-zinc-900 rounded-xl shadow-2xl px-8 py-8 w-[98vw] max-w-lg mx-auto
              border border-zinc-800"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-4 text-zinc-500 hover:text-zinc-300 transition"
              aria-label="Close"
              type="button"
              tabIndex={0}
              disabled={loading || submitting}
            >
              <X className="w-5 h-5" />
            </button >
            <h2 className="text-2xl font-bold mb-2 text-zinc-100">Create Product</h2>
            <p className="text-zinc-400 mb-6 text-sm">Fill out the details of your new product.</p>
            <form onSubmit={handleSubmit} autoComplete="off">
              <div className="grid grid-cols-1 gap-4">
                {/* Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-zinc-300 mb-1 text-sm font-medium"
                  >
                    Name<span className="ml-1 text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoFocus
                    disabled={loading || submitting}
                    className={`mt-1 w-full px-3 py-2 rounded-lg bg-zinc-800 border
                      ${errors.name && touched.name
                        ? "border-red-500 focus:border-red-500"
                        : "border-zinc-700 focus:border-emerald-500"}
                      text-zinc-100 focus:ring-0 placeholder-zinc-500 transition`}
                    value={form.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="e.g. T-shirt"
                  />
                  {errors.name && touched.name && (
                    <span className="text-xs text-red-500 mt-1 block">{errors.name}</span>
                  )}
                </div>
                {/* Description */}
                <div>
                  <label
                    htmlFor="description"
                    className="block text-zinc-300 mb-1 text-sm font-medium"
                  >
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows="3"
                    disabled={loading || submitting}
                    className="mt-1 w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 focus:border-emerald-500 focus:ring-0 placeholder-zinc-500 transition"
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
                    className="block text-zinc-300 mb-1 text-sm font-medium"
                  >
                    Price ($)<span className="ml-1 text-red-500">*</span>
                  </label>
                  <input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    disabled={loading || submitting}
                    className={`mt-1 w-full px-3 py-2 rounded-lg bg-zinc-800 border
                      ${errors.price && touched.price
                        ? "border-red-500 focus:border-red-500"
                        : "border-zinc-700 focus:border-emerald-500"}
                      text-zinc-100 focus:ring-0 placeholder-zinc-500 transition`}
                    value={form.price}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="19.99"
                  />
                  {errors.price && touched.price && (
                    <span className="text-xs text-red-500 mt-1 block">{errors.price}</span>
                  )}
                </div>
                {/* Stock */}
                <div>
                  <label
                    htmlFor="stock"
                    className="block text-zinc-300 mb-1 text-sm font-medium"
                  >
                    Stock<span className="ml-1 text-red-500">*</span>
                  </label>
                  <input
                    id="stock"
                    name="stock"
                    type="number"
                    min="0"
                    disabled={loading || submitting}
                    className={`mt-1 w-full px-3 py-2 rounded-lg bg-zinc-800 border
                      ${errors.stock && touched.stock
                        ? "border-red-500 focus:border-red-500"
                        : "border-zinc-700 focus:border-emerald-500"}
                      text-zinc-100 focus:ring-0 placeholder-zinc-500 transition`}
                    value={form.stock}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="0"
                  />
                  {errors.stock && touched.stock && (
                    <span className="text-xs text-red-500 mt-1 block">{errors.stock}</span>
                  )}
                </div>
                {/* SKU */}
                <div>
                  <label
                    htmlFor="sku"
                    className="block text-zinc-300 mb-1 text-sm font-medium"
                  >
                    SKU<span className="ml-1 text-red-500">*</span>
                  </label>
                  <input
                    id="sku"
                    name="sku"
                    type="text"
                    disabled={loading || submitting}
                    className={`mt-1 w-full px-3 py-2 rounded-lg bg-zinc-800 border
                      ${errors.sku && touched.sku
                        ? "border-red-500 focus:border-red-500"
                        : "border-zinc-700 focus:border-emerald-500"}
                      text-zinc-100 focus:ring-0 placeholder-zinc-500 transition`}
                    value={form.sku}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="e.g. SKU-12345"
                  />
                  {errors.sku && touched.sku && (
                    <span className="text-xs text-red-500 mt-1 block">{errors.sku}</span>
                  )}
                </div>
                {/* Category */}
                <div>
                  <label
                    htmlFor="category"
                    className="block text-zinc-300 mb-1 text-sm font-medium"
                  >
                    Category<span className="ml-1 text-red-500">*</span>
                  </label>
                  <input
                    id="category"
                    name="category"
                    type="text"
                    disabled={loading || submitting}
                    className={`mt-1 w-full px-3 py-2 rounded-lg bg-zinc-800 border
                      ${errors.category && touched.category
                        ? "border-red-500 focus:border-red-500"
                        : "border-zinc-700 focus:border-emerald-500"}
                      text-zinc-100 focus:ring-0 placeholder-zinc-500 transition`}
                    value={form.category}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="e.g. Apparel"
                  />
                  {errors.category && touched.category && (
                    <span className="text-xs text-red-500 mt-1 block">{errors.category}</span>
                  )}
                </div>
                {/* ImageUrl */}
                <div>
                  <label
                    htmlFor="imageUrl"
                    className="block text-zinc-300 mb-1 text-sm font-medium"
                  >
                    Image URL
                  </label>
                  <input
                    id="imageUrl"
                    name="imageUrl"
                    type="text"
                    disabled={loading || submitting}
                    className={`mt-1 w-full px-3 py-2 rounded-lg bg-zinc-800 border
                      ${errors.imageUrl && touched.imageUrl
                        ? "border-red-500 focus:border-red-500"
                        : "border-zinc-700 focus:border-emerald-500"}
                      text-zinc-100 focus:ring-0 placeholder-zinc-500 transition`}
                    value={form.imageUrl}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="https://example.com/image.jpg"
                  />
                  {errors.imageUrl && touched.imageUrl && (
                    <span className="text-xs text-red-500 mt-1 block">{errors.imageUrl}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-end mt-7 gap-3">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg text-zinc-300 bg-zinc-800 hover:bg-zinc-700 focus:outline-none border border-zinc-600 transition font-semibold disabled:opacity-60"
                  onClick={onClose}
                  disabled={loading || submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="relative px-5 py-2 rounded-lg font-semibold text-zinc-100 bg-emerald-600 hover:bg-emerald-500 focus:outline-none transition disabled:opacity-50 flex items-center gap-2"
                  disabled={loading || submitting || hasErrors}
                >
                  {(loading || submitting) && (
                    <Loader2 className="animate-spin w-5 h-5" />
                  )}
                  Create Product
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
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
};

export default ProductModal;