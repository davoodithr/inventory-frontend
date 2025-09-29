// src/pages/WarehouseTransactions.jsx
import React, { useMemo } from "react";
import Badge from "../components/Badge";
import { toJalaliDateTime } from "../utils/jalali";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function WarehouseTransactions({ filteredTrx, trxTone }) {
  // Aggregate quantities by product
  const aggregatedData = useMemo(() => {
    const map = {};
    filteredTrx.forEach((t) => {
      const name = t.product?.name || "نامشخص";
      if (!map[name]) map[name] = 0;
      map[name] += Number(t.qty) || 0;
    });
    return Object.entries(map).map(([name, qty]) => ({ name, qty }));
  }, [filteredTrx]);

  return (

    
    <div className="flex flex-col gap-6">
        {/* Header Section */}
      <div className="bg-gradient-to-l from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">تراکنش‌های انبار</h1>
            <p className="text-gray-600 mt-1">نمایش جامع تمامی تراکنش‌های انبار به همراه آمار</p>
          </div>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <div className="bg-white rounded-lg px-4 py-2 shadow-sm border">
              <span className="text-sm text-gray-600">تعداد تراکنش‌ها:</span>
              <span className="font-bold text-gray-800 mr-2">{filteredTrx.length}</span>
            </div>
          </div>
        </div>
           </div>
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
            <Bar dataKey="qty" fill="#8884d8" name="مقدار" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Transactions Table */}
      <div className="overflow-x-auto rounded-2xl border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm" dir="rtl">
          <thead className="bg-gray-50">
            <tr className="text-right text-gray-700">
              <th className="px-4 py-2 font-semibold">تاریخ (شمسی)</th>
              <th className="px-4 py-2 font-semibold">محصول</th>
              <th className="px-4 py-2 font-semibold">نوع تراکنش</th>
              <th className="px-4 py-2 font-semibold">کاربری</th>
              <th className="px-4 py-2 font-semibold">از انبار</th>
              <th className="px-4 py-2 font-semibold">به انبار</th>
              <th className="px-4 py-2 font-semibold">مقدار</th>
              <th className="px-4 py-2 font-semibold">واحد</th>
              <th className="px-4 py-2 font-semibold">ارجاع</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {filteredTrx.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 whitespace-nowrap">{toJalaliDateTime(t.created_at)}</td>
                <td className="px-4 py-2">{t.product?.name || "—"}</td>
                <td className="px-4 py-2">
                  <Badge tone={trxTone(t.trx_type)}>{t.trx_type}</Badge>
                </td>
                <td className="px-4 py-2">
                  <Badge tone="blue">{t.usage_type}</Badge>
                </td>
                <td className="px-4 py-2">{t.from_wh?.name || "—"}</td>
                <td className="px-4 py-2">{t.to_wh?.name || "—"}</td>
                <td className="px-4 py-2 font-semibold">{t.qty}</td>
                <td className="px-4 py-2">{t.uom?.name || t.uom?.code || "—"}</td>
                <td className="px-4 py-2">{t.ref || "—"}</td>
              </tr>
            ))}
            {filteredTrx.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-gray-500" colSpan={9}>
                  هیچ تراکنشی مطابق فیلترها یافت نشد.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
