import React from "react";
import { Package, AlertTriangle, XCircle, DollarSign, Activity } from "lucide-react";
import StatCard from "../ui/statcard";

const InventoryStats = ({ stats, loading }) => {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 animate-pulse">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="surface-card h-28 animate-pulse"
          ></div>
        ))}
      </div>
    );
  }

  const {
    totalProducts = 0,
    inStock = 0,
    lowStock = 0,
    outOfStock = 0,
    inventoryValue = 0,
    inventoryHealth = 100,
  } = stats;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
      <StatCard
        title="Total Products"
        value={totalProducts.toLocaleString()}
        icon={<Package size={20} />}
      />
      <StatCard
        title="In Stock"
        value={inStock.toLocaleString()}
        icon={<Package size={20} className="text-emerald-600 dark:text-emerald-400" />}
      />
      <StatCard
        title="Low Stock"
        value={lowStock.toLocaleString()}
        icon={<AlertTriangle size={20} className="text-amber-600 dark:text-amber-400" />}
      />
      <StatCard
        title="Out of Stock"
        value={outOfStock.toLocaleString()}
        icon={<XCircle size={20} className="text-red-600 dark:text-red-400" />}
      />
      <StatCard
        title="Inventory Value"
        value={`$${inventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        icon={<DollarSign size={20} className="text-indigo-600 dark:text-indigo-400" />}
      />
    </div>
  );
};

export default InventoryStats;
