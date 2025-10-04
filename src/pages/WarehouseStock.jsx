import React, { useMemo, useState } from "react";
import {
  PieChart,
  Pie,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";

export default function WarehouseStock({ filteredQuants, productType }) {
  // Define colors for pie slices
  const COLORS = ["#8884d8", "#82ca9d", "#ffc107", "#ff5722", "#ab47bc", "#26a69a"];

  // State to track the selected assembly for drill-down
  const [selectedAssembly, setSelectedAssembly] = useState(null);

  // Aggregate data for the pie chart
  const aggregatedData = useMemo(() => {
    const map = {};

    (filteredQuants || []).forEach((row) => {
      const product = row.product;
      const qty = Math.abs(parseFloat(row.qty || 0)); // Use absolute value for pie chart
      const name = product?.name || "نامشخص";

      // For components or "all", aggregate the product quantities directly
      if (product.product_type === "component" || productType === "all") {
        if (!map[name]) map[name] = { qty: 0, type: product.product_type, product };
        map[name].qty += qty;
      }

      // For assemblies, include BOM components if productType is "assembly" or "all"
      if (product.product_type === "assembly" && (productType === "assembly" || productType === "all")) {
        if (!map[name]) map[name] = { qty: 0, type: product.product_type, product };
        map[name].qty += qty;
      }
    });

    return Object.entries(map)
      .map(([name, data]) => ({
        name,
        qty: data.qty,
        type: data.type,
        product: data.product,
      }))
      .filter((item) => item.qty > 0); // Exclude zero or negative quantities
  }, [filteredQuants, productType]);

  // Data for components of the selected assembly (for drill-down)
  const componentData = useMemo(() => {
    if (!selectedAssembly || productType !== "assembly") return [];

    const product = selectedAssembly.product;
    const qty = selectedAssembly.qty;
    const components = [];

    if (product.bom_lines?.length > 0) {
      product.bom_lines.forEach((line) => {
        const componentName = line.component?.name || "نامشخص";
        const factor = 1 + parseFloat(line.scrap_factor_pct || 0) / 100;
        const componentQty = qty * parseFloat(line.quantity || 0) * factor;

        if (componentQty > 0) {
          components.push({
            name: componentName,
            qty: componentQty,
            type: "component",
          });
        }
      });
    }

    return components;
  }, [selectedAssembly, productType]);

  // Handle click on a pie segment to drill down into assembly components
  const handlePieClick = (data) => {
    if (data.type === "assembly" && productType === "assembly") {
      setSelectedAssembly(data);
    } else {
      setSelectedAssembly(null); // Reset to top-level view
    }
  };

  const renderRows = (product, uom, qty, level = 0) => {
    const calcQty = qty.toFixed(3);
    const row = (
      <tr
        key={`${product.id}-${level}`}
        className={level > 0 ? "bg-gray-50 hover:bg-gray-100" : "hover:bg-gray-50"}
      >
        <td className="px-4 py-2" style={{ paddingRight: `${4 + level * 20}px` }}>
          {product.name || "—"}
        </td>
        <td className="px-4 py-2">{product.barcode || "—"}</td>
        <td className="px-4 py-2 font-semibold font-mono">{calcQty}</td>
        <td className="px-4 py-2">{uom.name || "—"}</td>
      </tr>
    );

    const subRows = [];
    if (product.product_type === "assembly" && product.bom_lines?.length > 0 && productType === "assembly") {
      product.bom_lines.forEach((line) => {
        const factor = 1 + parseFloat(line.scrap_factor_pct || 0) / 100;
        const subQty = qty * parseFloat(line.quantity || 0) * factor;
        subRows.push(...renderRows(line.component, line.uom, subQty, level + 1));
      });
    }

    return [row, ...subRows];
  };

  const tableRows = useMemo(() => {
    if (productType === "assembly") {
      return filteredQuants.flatMap((row) =>
        renderRows(row.product, row.uom, parseFloat(row.qty || 0))
      );
    } else {
      return filteredQuants.map((row) => (
        <tr key={row.id} className="hover:bg-gray-50">
          <td className="px-4 py-2">{row.product?.name || "—"}</td>
          <td className="px-4 py-2">{row.product?.barcode || "—"}</td>
          <td className="px-4 py-2 font-semibold">{row.qty}</td>
          <td className="px-4 py-2">{row.uom?.name || "—"}</td>
        </tr>
      ));
    }
  }, [filteredQuants, productType]);

  return (
    <div className="flex flex-col gap-6">
      {/* CSS to enforce normal font weight */}
      <style>
        {`
          .recharts-text, .recharts-legend-item-text {
            font-family: "Vazirmatn", sans-serif !important;
            font-weight: 400 !important;
          }
        `}
      </style>

      {/* Pie Chart */}
      <div style={{ width: "100%", height: 400 }}>
        <ResponsiveContainer>
          <PieChart>
            {/* Outer Pie (Top-level: Assemblies or Components) */}
            <Pie
              data={selectedAssembly ? componentData : aggregatedData}
              dataKey="qty"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={selectedAssembly ? 80 : 120}
              paddingAngle={5}
              label={({ name, qty }) => `${name}: ${qty.toFixed(3)}`}
              onClick={handlePieClick}
            >
              {(selectedAssembly ? componentData : aggregatedData).map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.type === "assembly" ? COLORS[index % COLORS.length] : COLORS[(index + 1) % COLORS.length]}
                  style={{ cursor: entry.type === "assembly" ? "pointer" : "default" }}
                />
              ))}
            </Pie>
            {/* Inner Pie (Components when an assembly is selected) */}
            {selectedAssembly && (
              <Pie
                data={aggregatedData}
                dataKey="qty"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={100}
                outerRadius={120}
                paddingAngle={5}
                label={false}
              >
                {aggregatedData.map((entry, index) => (
                  <Cell
                    key={`inner-cell-${index}`}
                    fill={entry.type === "assembly" ? COLORS[index % COLORS.length] : COLORS[(index + 1) % COLORS.length]}
                    style={{ cursor: "pointer" }}
                    onClick={() => setSelectedAssembly(null)} // Click to go back to top-level
                  />
                ))}
              </Pie>
            )}
            <Tooltip
              formatter={(value, name, props) => [
                value.toFixed(3),
                props.payload.type === "assembly" ? "مونتاژ" : "قطعه",
              ]}
              contentStyle={{
                fontFamily: "Vazirmatn, sans-serif",
                fontWeight: 400,
              }}
            />
            <Legend
              formatter={(value) => value}
              wrapperStyle={{
                fontFamily: "Vazirmatn, sans-serif",
                fontWeight: 400,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        {selectedAssembly && (
          <div className="text-center mt-2">
            <button
              className="text-sm text-blue-600 hover:underline"
              style={{ fontFamily: "Vazirmatn, sans-serif", fontWeight: 400 }}
              onClick={() => setSelectedAssembly(null)}
            >
              بازگشت به نمای کلی
            </button>
          </div>
        )}
      </div>

      {/* Stock Table */}
      <div className="overflow-x-auto rounded-2xl border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm" dir="rtl">
          <thead className="bg-gray-50">
            <tr className="text-right text-gray-700">
              <th className="px-4 py-2 font-semibold" style={{ fontWeight: 400 }}>
                محصول
              </th>
              <th className="px-4 py-2 font-semibold" style={{ fontWeight: 400 }}>
                بارکد
              </th>
              <th className="px-4 py-2 font-semibold" style={{ fontWeight: 400 }}>
                مقدار
              </th>
              <th className="px-4 py-2 font-semibold" style={{ fontWeight: 400 }}>
                واحد
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {tableRows}
            {tableRows.length === 0 && (
              <tr>
                <td
                  className="px-4 py-6 text-center text-gray-500"
                  colSpan={4}
                  style={{ fontFamily: "Vazirmatn, sans-serif", fontWeight: 400 }}
                >
                  هیچ ردیفی یافت نشد.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}