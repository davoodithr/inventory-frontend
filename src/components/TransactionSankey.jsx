import React from "react";
import { Sankey, Tooltip, ResponsiveContainer } from "recharts";

export default function TransactionSankey({ transactions }) {
  // ساخت nodes یکتا بر اساس نام انبارها
  const nodes = [];
  transactions.forEach((t) => {
    if (!nodes.find((n) => n.name === t.from_wh.name)) {
      nodes.push({ name: t.from_wh.name });
    }
    if (!nodes.find((n) => n.name === t.to_wh.name)) {
      nodes.push({ name: t.to_wh.name });
    }
  });

  // ساخت links با ایندکس nodes و تبدیل qty به عدد
  const links = transactions
    .map((t) => {
      const source = nodes.findIndex((n) => n.name === t.from_wh.name);
      const target = nodes.findIndex((n) => n.name === t.to_wh.name);
      const value = Number(t.qty) || 0; // اگر NaN بود، صفر
      if (value <= 0) return null; // لینک‌های صفر یا منفی را حذف می‌کنیم
      return { source, target, value };
    })
    .filter((l) => l !== null);

  if (links.length === 0) {
    return (
      <div className="w-full h-96 flex items-center justify-center bg-white rounded-xl shadow-sm text-gray-500">
        هیچ انتقالی برای نمایش وجود ندارد.
      </div>
    );
  }

  return (
    <div className="w-full h-96 p-4 bg-white rounded-xl shadow-sm">
      <ResponsiveContainer width="100%" height="100%">
        <Sankey data={{ nodes, links }} nodePadding={10} nodeWidth={16}>
          <Tooltip />
        </Sankey>
      </ResponsiveContainer>
    </div>
  );
}
