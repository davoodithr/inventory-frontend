// \src\components\WarehouseTimeline.jsx
import React from "react";
import { format } from "date-fns-jalali";

export default function WarehouseTimeline({ tracking }) {
  if (!tracking?.tracking_history?.length)
    return <div className="p-4 text-gray-500">هیچ تراکنشی یافت نشد.</div>;

  // 🔹 Sort transactions by created_at (ascending)
  const events = [...tracking.tracking_history]
    .sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
    .map((t, i) => ({
      id: i,
      product: t.product_name || t.product?.name || "نامشخص",
      qty: t.qty,
      created_at: new Date(t.created_at),
    }));

  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm mb-6">
      <h3 className="font-semibold mb-3">نمودار زمانی تراکنش‌ها (جلالی)</h3>

      {/* 🔹 Horizontal timeline container */}
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "flex-start",
          overflowX: "auto",
          paddingBottom: 30,
          paddingTop: 10,
        }}
      >
        {/* Horizontal line */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: 0,
            right: 0,
            height: 2,
            backgroundColor: "#ccc",
            zIndex: 1,
          }}
        />

        {/* 🔹 Render events sorted by time */}
        {events.map((e) => (
          <div
            key={e.id}
            style={{
              position: "relative",
              zIndex: 2,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginRight: 40,
            }}
          >
            {/* Red flexible box */}
            <div
              style={{
                backgroundColor: "#ff4c4c",
                color: "#fff",
                padding: "10px 16px",
                borderRadius: 10,
                minWidth: 120,
                textAlign: "center",
                fontWeight: 600,
                fontSize: 14,
                boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                marginBottom: 10,
                whiteSpace: "normal",
                lineHeight: 1.5,
              }}
            >
              {e.product}
              <div style={{ fontWeight: 400, fontSize: 13 }}>
                مقدار: {e.qty}
              </div>
            </div>

            {/* Dot on line */}
            <div
              style={{
                width: 16,
                height: 16,
                backgroundColor: "#ff4c4c",
                borderRadius: "50%",
                border: "2px solid #b30000",
                marginBottom: 8,
              }}
            />

            {/* Jalali date below */}
            <div style={{ color: "#555", fontSize: 12 }}>
              {format(e.created_at, "yyyy/MM/dd HH:mm")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
