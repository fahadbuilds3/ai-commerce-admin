import React from "react";
import PropTypes from "prop-types";
import InventoryBadge from "./InventoryBadge";
import { Pencil, Trash2, Loader2, ImageOff } from "lucide-react";

// Table headers config for scalability
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
  emptyMessage = "No products found.",
}) => {
  return (
    <div className="w-full bg-zinc-900 text-zinc-100 rounded-xl shadow-lg overflow-x-auto border border-zinc-800">
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
            products.map((product) => (
              <tr
                key={product.id}
                className="transition-colors hover:bg-zinc-800/70 group"
              >
                {/* Image */}
                <td className="px-4 py-3">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded-md border border-zinc-800 bg-zinc-800"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-12 h-12 rounded-md border border-zinc-800 bg-zinc-800 text-zinc-600">
                      <ImageOff className="w-5 h-5" />
                    </div>
                  )}
                </td>
                {/* Name */}
                <td className="px-4 py-3">
                  <span className="font-semibold text-zinc-100">
                    {product.name}
                  </span>
                  <div className="text-xs text-zinc-500">{product.sku || null}</div>
                </td>
                {/* Category */}
                <td className="px-4 py-3">
                  <span className="inline-block bg-zinc-800 text-zinc-400 px-2 py-1 rounded text-xs">
                    {product.category || "Uncategorized"}
                  </span>
                </td>
                {/* Price */}
                <td className="px-4 py-3 font-mono">
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
                      aria-label="Edit"
                      onClick={() => onEdit && onEdit(product)}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-red-600 hover:text-white focus:outline-none transition-colors"
                      aria-label="Delete"
                      onClick={() => onDelete && onDelete(product)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length}>
                <div className="flex flex-col items-center justify-center py-24 text-zinc-500">
                  <ImageOff className="w-12 h-12 mb-4" />
                  <div className="text-lg font-semibold">{emptyMessage}</div>
                  <div className="text-sm mt-1">Add products to see them here.</div>
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
  emptyMessage: PropTypes.string,
};

ProductTable.defaultProps = {
  products: [],
  loading: false,
  onEdit: undefined,
  onDelete: undefined,
  emptyMessage: "No products found.",
};

export default ProductTable;