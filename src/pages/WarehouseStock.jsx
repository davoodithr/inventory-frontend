// import React, { useMemo, useState } from "react";
// import {
//   PieChart,
//   Pie,
//   Tooltip,
//   ResponsiveContainer,
//   Legend,
//   Cell,
// } from "recharts";

// export default function WarehouseStock({ filteredQuants, productType }) {
//   // Define colors for pie slices
//   const COLORS = [
//     "#8884d8",
//     "#82ca9d",
//     "#ffc107",
//     "#ff5722",
//     "#ab47bc",
//     "#26a69a",
//   ];

//   // State to track the selected assembly for drill-down
//   const [selectedAssembly, setSelectedAssembly] = useState(null);

//   // Aggregate data for the pie chart
//   const aggregatedData = useMemo(() => {
//     const map = {};

//     (filteredQuants || []).forEach((row) => {
//       const product = row.product;
//       const qty = Math.abs(parseFloat(row.qty || 0)); // Use absolute value for pie chart
//       const name = product?.name || "نامشخص";

//       if (!product) return;

//       // For components or "all", aggregate the product quantities directly
//       if (product.product_type === "component" || productType === "all") {
//         if (!map[name]) map[name] = { qty: 0, type: product.product_type, product };
//         map[name].qty += qty;
//       }

//       // For assemblies, include BOM components if productType is "assembly" or "all"
//       if (
//         product.product_type === "assembly" &&
//         (productType === "assembly" || productType === "all")
//       ) {
//         if (!map[name]) map[name] = { qty: 0, type: product.product_type, product };
//         map[name].qty += qty;
//       }
//     });

//     return Object.entries(map)
//       .map(([name, data]) => ({
//         name,
//         qty: data.qty,
//         type: data.type,
//         product: data.product,
//       }))
//       .filter((item) => item.qty > 0);
//   }, [filteredQuants, productType]);

//   // Data for components of the selected assembly (for drill-down)
//   const componentData = useMemo(() => {
//     if (!selectedAssembly || productType !== "assembly") return [];

//     const product = selectedAssembly.product;
//     const qty = selectedAssembly.qty;
//     const components = [];

//     if (product?.bom_lines?.length > 0) {
//       product.bom_lines.forEach((line) => {
//         const componentName = line.component?.name || "نامشخص";
//         const factor = 1 + parseFloat(line.scrap_factor_pct || 0) / 100;
//         const componentQty = qty * parseFloat(line.quantity || 0) * factor;

//         if (componentQty > 0) {
//           components.push({
//             name: componentName,
//             qty: componentQty,
//             type: "component",
//           });
//         }
//       });
//     }

//     return components;
//   }, [selectedAssembly, productType]);

//   // Handle click on a pie segment to drill down into assembly components
//   const handlePieClick = (data) => {
//     if (data.type === "assembly" && productType === "assembly") {
//       setSelectedAssembly(data);
//     } else {
//       setSelectedAssembly(null);
//     }
//   };

//   const renderRows = (product, uom, qty, level = 0) => {
//     const calcQty = qty.toFixed(3);
//     const row = (
//       <tr
//         key={`${product.id}-${level}-${product.name}`}
//         className={level > 0 ? "bg-gray-50 hover:bg-gray-100" : "hover:bg-gray-50"}
//       >
//         <td className="px-4 py-2" style={{ paddingRight: `${4 + level * 20}px` }}>
//           {product.name || "—"}
//         </td>
//         <td className="px-4 py-2">{product.barcode || "—"}</td>
//         <td className="px-4 py-2 font-semibold font-mono">{calcQty}</td>
//         <td className="px-4 py-2">{uom?.name || "—"}</td>
//       </tr>
//     );

//     const subRows = [];
//     if (
//       product.product_type === "assembly" &&
//       product.bom_lines?.length > 0 &&
//       productType === "assembly"
//     ) {
//       product.bom_lines.forEach((line) => {
//         const factor = 1 + parseFloat(line.scrap_factor_pct || 0) / 100;
//         const subQty = qty * parseFloat(line.quantity || 0) * factor;
//         subRows.push(...renderRows(line.component, line.uom, subQty, level + 1));
//       });
//     }

//     return [row, ...subRows];
//   };

//   const tableRows = useMemo(() => {
//     if (productType === "assembly") {
//       return filteredQuants.flatMap((row) =>
//         renderRows(row.product, row.uom, parseFloat(row.qty || 0))
//       );
//     } else {
//       return filteredQuants.map((row) => (
//         <tr key={row.id} className="hover:bg-gray-50">
//           <td className="px-4 py-2">{row.product?.name || "—"}</td>
//           <td className="px-4 py-2">{row.product?.barcode || "—"}</td>
//           <td className="px-4 py-2 font-semibold">{row.qty}</td>
//           <td className="px-4 py-2">{row.uom?.name || "—"}</td>
//         </tr>
//       ));
//     }
//   }, [filteredQuants, productType]);

//   return (
//     <div className="flex flex-col gap-6">
//       {/* ✅ Enforce consistent Farsi font style */}
//       <style>
//         {`
//           .recharts-text, .recharts-legend-item-text {
//             font-family: "Vazirmatn", sans-serif !important;
//             font-weight: 400 !important;
//           }
//         `}
//       </style>

//       {/* Pie Chart */}
//       <div style={{ width: "100%", height: 400 }}>
//         <ResponsiveContainer>
//           <PieChart>
//             <Pie
//               data={selectedAssembly ? componentData : aggregatedData}
//               dataKey="qty"
//               nameKey="name"
//               cx="50%"
//               cy="50%"
//               outerRadius={selectedAssembly ? 80 : 120}
//               paddingAngle={5}
//               label={({ name, qty }) => `${name}: ${qty.toFixed(3)}`}
//               onClick={handlePieClick}
//             >
//               {(selectedAssembly ? componentData : aggregatedData).map(
//                 (entry, index) => (
//                   <Cell
//                     key={`cell-${index}`}
//                     fill={
//                       entry.type === "assembly"
//                         ? COLORS[index % COLORS.length]
//                         : COLORS[(index + 1) % COLORS.length]
//                     }
//                     style={{
//                       cursor: entry.type === "assembly" ? "pointer" : "default",
//                     }}
//                   />
//                 )
//               )}
//             </Pie>

//             {/* Inner Pie for context when drilling down */}
//             {selectedAssembly && (
//               <Pie
//                 data={aggregatedData}
//                 dataKey="qty"
//                 nameKey="name"
//                 cx="50%"
//                 cy="50%"
//                 innerRadius={100}
//                 outerRadius={120}
//                 paddingAngle={5}
//                 label={false}
//               >
//                 {aggregatedData.map((entry, index) => (
//                   <Cell
//                     key={`inner-cell-${index}`}
//                     fill={
//                       entry.type === "assembly"
//                         ? COLORS[index % COLORS.length]
//                         : COLORS[(index + 1) % COLORS.length]
//                     }
//                     style={{ cursor: "pointer" }}
//                     onClick={() => setSelectedAssembly(null)}
//                   />
//                 ))}
//               </Pie>
//             )}

//             <Tooltip
//               formatter={(value, name, props) => [
//                 value.toFixed(3),
//                 props.payload.type === "assembly" ? "مونتاژ" : "قطعه",
//               ]}
//               contentStyle={{
//                 fontFamily: "Vazirmatn, sans-serif",
//                 fontWeight: 400,
//               }}
//             />
//             <Legend
//               formatter={(value) => value}
//               wrapperStyle={{
//                 fontFamily: "Vazirmatn, sans-serif",
//                 fontWeight: 400,
//               }}
//             />
//           </PieChart>
//         </ResponsiveContainer>

//         {selectedAssembly && (
//           <div className="text-center mt-2">
//             <button
//               className="text-sm text-blue-600 hover:underline"
//               style={{
//                 fontFamily: "Vazirmatn, sans-serif",
//                 fontWeight: 400,
//               }}
//               onClick={() => setSelectedAssembly(null)}
//             >
//               بازگشت به نمای کلی
//             </button>
//           </div>
//         )}
//       </div>

//       {/* Stock Table */}
//       <div className="overflow-x-auto rounded-2xl border border-gray-200">
//         <table className="min-w-full divide-y divide-gray-200 text-sm" dir="rtl">
//           <thead className="bg-gray-50">
//             <tr className="text-right text-gray-700">
//               <th className="px-4 py-2 font-semibold" style={{ fontWeight: 400 }}>
//                 محصول
//               </th>
//               <th className="px-4 py-2 font-semibold" style={{ fontWeight: 400 }}>
//                 بارکد
//               </th>
//               <th className="px-4 py-2 font-semibold" style={{ fontWeight: 400 }}>
//                 مقدار
//               </th>
//               <th className="px-4 py-2 font-semibold" style={{ fontWeight: 400 }}>
//                 واحد
//               </th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-gray-100 bg-white">
//             {tableRows}
//             {tableRows.length === 0 && (
//               <tr>
//                 <td
//                   className="px-4 py-6 text-center text-gray-500"
//                   colSpan={4}
//                   style={{
//                     fontFamily: "Vazirmatn, sans-serif",
//                     fontWeight: 400,
//                   }}
//                 >
//                   هیچ ردیفی یافت نشد.
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }



// src/pages/WarehouseStock.jsx
import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const WarehouseStock = ({ warehouseId, query = "", productType = "all" }) => {
  const [inventory, setInventory] = useState({ components: [], assemblies: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    async function fetchInventory() {
      try {
        setLoading(true);
        setError("");
        const { data } = await api.get(`/inv/warehouse/${warehouseId}/overall/`);
        if (!alive) return;
        setInventory({
          components: data.components || [],
          assemblies: data.assemblies || [],
        });
      } catch (err) {
        if (!alive) return;
        setError("خطا در دریافت اطلاعات موجودی");
        console.error("Failed to fetch inventory", err);
      } finally {
        if (alive) setLoading(false);
      }
    }
    fetchInventory();
    return () => { alive = false; };
  }, [warehouseId]);

  const filteredInventory = useMemo(() => {
    let components = [...inventory.components];
    let assemblies = [...inventory.assemblies];

    if (productType !== "all") {
      if (productType === "component") {
        assemblies = [];
      } else if (productType === "assembly") {
        components = [];
      }
    }

    if (query.trim()) {
      const needle = query.trim().toLowerCase();
      components = components.filter((c) =>
        String(c.name || "").toLowerCase().includes(needle)
      );
      assemblies = assemblies.filter((a) =>
        String(a.name || "").toLowerCase().includes(needle)
      );
    }

    return { components, assemblies };
  }, [inventory, query, productType]);

  const chartData = useMemo(() => {
    if (filteredInventory.components.length + filteredInventory.assemblies.length === 0) return null;

    let allProducts = [
      ...filteredInventory.assemblies.map((a) => ({
        label: `${a.name} ${a.is_semi_finished ? "(نیم‌ساخت)" : "(تجمیع)"}`,
        value: a.total_qty,
        backgroundColor: a.is_semi_finished ? "#3B82F6" : "#10B981",
      })),
      ...filteredInventory.components.map((c) => ({
        label: `${c.name} (قطعه)`,
        value: c.total_qty,
        backgroundColor: "#F59E0B",
      })),
    ];

    allProducts.sort((a, b) => b.value - a.value);
    const topItems = allProducts.slice(0, 5);
    const othersSum = allProducts.slice(5).reduce((sum, item) => sum + item.value, 0);

    let processedItems = topItems;
    if (othersSum > 0) {
      processedItems = [
        ...topItems,
        { label: "سایر", value: othersSum, backgroundColor: "#6B7280" },
      ];
    }

    return {
      labels: processedItems.map((p) => p.label),
      datasets: [
        {
          data: processedItems.map((p) => p.value),
          backgroundColor: processedItems.map((p) => p.backgroundColor),
        },
      ],
    };
  }, [filteredInventory]);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "right",
        align: "center",
        labels: {
          padding: 15,
          usePointStyle: true,
          font: { size: 10, family: "Tahoma, sans-serif" },
          generateLabels: (chart) => {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label, i) => {
                const value = data.datasets[0].data[i];
                const color = data.datasets[0].backgroundColor[i];
                return {
                  text: `${label}: ${value}`,
                  fillStyle: color,
                  strokeStyle: color,
                  lineWidth: 1,
                  hidden: false,
                  index: i,
                };
              });
            }
            return [];
          },
        },
      },
      tooltip: {
        rtl: true,
        callbacks: {
          label: (context) => `${context.label}: ${context.parsed} عدد`,
        },
      },
    },
    maintainAspectRatio: false,
  };

  if (loading) {
    return <div className="h-64 flex items-center justify-center text-gray-500">در حال بارگذاری...</div>;
  }

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      {/* Pie Chart */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">توزیع موجودی انبار</h3>
        {chartData ? (
          <div style={{ height: "300px", position: "relative" }}>
            <Pie data={chartData} options={chartOptions} />
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">بدون داده</div>
        )}
      </div>

      {/* Components Table */}
      {filteredInventory.components.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">قطعات (Components)</h3>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">شناسه محصول</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">نام</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">مقدار</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInventory.components.map((c) => (
                <tr key={c.product_id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.product_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{c.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.total_qty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Assemblies Table */}
      {filteredInventory.assemblies.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">محصولات مونتاژی (Assemblies)</h3>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">شناسه محصول</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">نام</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">مقدار</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">نیم‌ساخته؟</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInventory.assemblies.map((a) => (
                <tr key={a.product_id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{a.product_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{a.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{a.total_qty}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{a.is_semi_finished ? "بله" : "خیر"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default WarehouseStock;