import React from "react";
import PropTypes from "prop-types";
import InventoryBadge from "./InventoryBadge";
import { Pencil, Trash2, Loader2, ImageOff, Plus } from "lucide-react";

// Helper: Accessible placeholder for missing or invalid images
const ProductImage = React.memo(function ProductImage({ src, alt }) {
  // Production-ready placeholder for missing/invalid images (CDN-ready)
  const placeholder = (
    <div className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-lg border border-zinc-800 bg-zinc-800 text-zinc-600 transition-colors min-w-[56px] min-h-[56px]">
      <ImageOff className="w-6 h-6" aria-label="No image" />
    </div>
  );

  // If no src or clearly invalid, show the placeholder
  if (!src || typeof src !== "string" || !/^https?:\/\/.+\.(jpeg|jpg|png|webp|gif|svg)?/i.test(src.trim())) {
    return placeholder;
  }

  // Responsive/modern e-com admin img, fallback to placeholder on error
  return (
    <img
      src={src}
      alt={alt || "Product image"}
      loading="lazy"
      decoding="async"
      className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-lg border border-zinc-800 bg-zinc-900 transition group-hover:scale-[1.05] group-hover:shadow-lg duration-150 ease-out"
      style={{ minWidth: 56, minHeight: 56 }}
      onError={(e) => {
        e.target.onerror = null;
        e.target.src = ""; // Triggers rerender after bad img, show placeholder
        e.target.style.display = "none"; // hide broken <img>, placeholder stays
        // Optionally: could use state to trigger React rerender for even cleaner swap
      }}
    />
  );
});

ProductImage.displayName = "ProductImage";

/**
 * ProductTable - Modern SaaS dashboard data table for products with thumbnail image, responsive layout, and fallback support.
 */
const columns = [
  { key: "image", label: "" },
  { key: "name", label: "Product Name" },
  { key: "category", label: "Category" },
  { key: "price", label: "Price" },
  { key: "stock", label: "Stock" },
  { key: "status", label: "Status" },
  { key: "actions", label: "" },
];

const ProductTable = ({
  products,
  loading,
  onEdit,
  onDelete,
  onAdd,
  emptyMessage = "No products found.",
}) => {
  // Handler for Add Product button
  const handleAddProduct = () => {
    if (typeof onAdd === "function") {
      onAdd();
    }
  };

  // Handler for Edit button
  const handleEdit = (product) => {
    if (typeof onEdit === "function") {
      onEdit(product);
    }
  };

  // Handler for Delete button
  const handleDelete = (product) => {
    if (typeof onDelete === "function") {
      onDelete(product.id);
    }
  };

  return (
    <div className="w-full bg-zinc-900 text-zinc-100 rounded-xl shadow-lg overflow-x-auto border border-zinc-800">
      {/* Add Product button is visible above the table if a handler is provided */}
      {typeof onAdd === "function" && (
        <div className="flex justify-end items-center p-4">
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow transition-colors"
            onClick={handleAddProduct}
            aria-label="Add Product"
            tabIndex={0}
          >
            <Plus className="w-5 h-5" />
            Add Product
          </button>
        </div>
      )}
      <table className="min-w-full divide-y divide-zinc-800">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-left text-sm font-semibold tracking-wider text-zinc-400 uppercase bg-zinc-900"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length}>
                <div className="flex justify-center items-center py-16">
                  <Loader2 className="animate-spin w-8 h-8 text-zinc-400" />
                  <span className="ml-3 text-zinc-400 font-medium">
                    Loading products...
                  </span>
                </div>
              </td>
            </tr>
          ) : products && products.length > 0 ? (
            products.map((product) => {
              // Debug log for image URL
              // eslint-disable-next-line no-console
              console.log("[ProductTable] Rendering image for product:", product.name, "URL:", product.imageUrl);

              return (
                <tr
                  key={product.id}
                  className="transition-colors hover:bg-zinc-800/70 group"
                  tabIndex={0}
                >
                  {/* Product Thumbnail Image */}
                  <td className="px-4 py-3 align-middle">
                    <ProductImage src={product.imageUrl} alt={product.name} />
                  </td>
                  {/* Product Name and SKU */}
                  <td className="px-4 py-3 min-w-[128px]">
                    <span className="font-semibold text-zinc-100 leading-tight break-words max-w-[14rem] block">
                      {product.name}
                    </span>
                    {product.sku ? (
                      <div className="text-xs text-zinc-500 truncate">{product.sku}</div>
                    ) : null}
                  </td>
                  {/* Category */}
                  <td className="px-4 py-3 min-w-[90px]">
                    <span className="inline-block bg-zinc-800 text-zinc-400 px-2 py-1 rounded text-xs max-w-[8rem] truncate">
                      {product.category || "Uncategorized"}
                    </span>
                  </td>
                  {/* Price */}
                  <td className="px-4 py-3 font-mono min-w-[80px]">
                    ${Number(product.price).toFixed(2)}
                  </td>
                  {/* Stock */}
                  <td className="px-4 py-3">
                    <span className="block font-medium">{product.stock}</span>
                  </td>
                  {/* Status */}
                  <td className="px-4 py-3">
                    <InventoryBadge stock={product.stock} />
                  </td>
                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-blue-600 hover:text-white focus:outline-none transition-colors"
                        aria-label="Edit product"
                        onClick={() => handleEdit(product)}
                        tabIndex={0}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-red-600 hover:text-white focus:outline-none transition-colors"
                        aria-label="Delete product"
                        onClick={() => handleDelete(product)}
                        tabIndex={0}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={columns.length}>
                <div className="flex flex-col items-center justify-center py-24 text-zinc-500">
                  <ImageOff className="w-12 h-12 mb-4" />
                  <div className="text-lg font-semibold">{emptyMessage}</div>
                  <div className="text-sm mt-1">Add products to see them here.</div>
                  {/* Show Add Product button in empty state if handler is provided */}
                  {typeof onAdd === "function" && (
                    <button
                      type="button"
                      className="mt-8 flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow transition-colors"
                      onClick={handleAddProduct}
                      aria-label="Add Product (empty)"
                      tabIndex={0}
                    >
                      <Plus className="w-5 h-5" />
                      Add Product
                    </button>
                  )}
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

ProductTable.propTypes = {
  products: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.any.isRequired,
      imageUrl: PropTypes.string,
      name: PropTypes.string.isRequired,
      sku: PropTypes.string,
      category: PropTypes.string,
      price: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
      stock: PropTypes.number.isRequired,
    })
  ),
  loading: PropTypes.bool,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onAdd: PropTypes.func,
  emptyMessage: PropTypes.string,
};

ProductTable.defaultProps = {
  products: [],
  loading: false,
  onEdit: undefined,
  onDelete: undefined,
  onAdd: undefined,
  emptyMessage: "No products found.",
};

export default ProductTable;