// src/pages/WarehouseStock.jsx
import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LabelList,
} from "recharts";

export default function WarehouseStock({ filteredQuants }) {
  // Aggregate data for plot
  const aggregatedData = useMemo(() => {
    const map = {};
    (filteredQuants || []).forEach((row) => {
      const name = row.product?.name || "نامشخص";
      if (!map[name]) map[name] = 0;
      map[name] += Number(row.qty) || 0;
    });
    return Object.entries(map).map(([name, qty]) => ({
      name,
      qty,
    }));
  }, [filteredQuants]);

  return (
    <div className="flex flex-col gap-6">
      {/* Chart */}
      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <BarChart
            data={aggregatedData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar
              dataKey="qty"
              name="مقدار"
              fill="#8884d8"
              label={{ position: "top" }}
            >
              <LabelList dataKey="qty" position="top" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Stock Table */}
      <div className="overflow-x-auto rounded-2xl border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm" dir="rtl">
          <thead className="bg-gray-50">
            <tr className="text-right text-gray-700">
              <th className="px-4 py-2 font-semibold">محصول</th>
              <th className="px-4 py-2 font-semibold">بارکد</th>
              <th className="px-4 py-2 font-semibold">مقدار</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {(filteredQuants || []).map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="px-4 py-2">{row.product?.name || "—"}</td>
                <td className="px-4 py-2">{row.product?.barcode || "—"}</td>
                <td className="px-4 py-2 font-semibold">{row.qty}</td>
              </tr>
            ))}
            {(filteredQuants || []).length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-gray-500" colSpan={3}>
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
