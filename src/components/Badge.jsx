// src/components/Badge.jsx
import React from "react";

export default function Badge({ children, tone = "gray" }) {
  const map = {
    gray: "bg-gray-100 text-gray-800",
    blue: "bg-blue-100 text-blue-700",
    green: "bg-green-100 text-green-700",
    amber: "bg-amber-100 text-amber-700",
    violet: "bg-violet-100 text-violet-700",
    red: "bg-rose-100 text-rose-700",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        map[tone] || map.gray
      }`}
    >
      {children}
    </span>
  );
}
