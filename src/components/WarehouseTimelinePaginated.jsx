// src/components/WarehouseTimelinePaginated.jsx
import React, { useEffect, useState } from "react";
import { fetchWarehouseTrackingPage } from "../api/client";
import WarehouseTimeline from "./WarehouseTimeline";

export default function WarehouseTimelinePaginated({ warehouseId }) {
  const [tracking, setTracking] = useState({ tracking_history: [] });
  const [nextUrl, setNextUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    // Load first page on mount
    loadPage(`/inv/inventory-tracking/${warehouseId}/warehouse/`);
  }, [warehouseId]);

  const loadPage = async (url) => {
    if (!url) return;
    setLoading(true);
    try {
      const data = await fetchWarehouseTrackingPage(url);
      setTracking((prev) => ({
        ...data,
        tracking_history: [
          ...(prev.tracking_history || []),
          ...data.tracking_history,
        ],
      }));
      setNextUrl(data.next);
      setHasMore(Boolean(data.next));
    } catch (err) {
      console.error("Pagination fetch failed:", err);
    }
    setLoading(false);
  };

  const handleLoadMore = () => {
    if (nextUrl) loadPage(nextUrl);
  };

  // 🔹 Optional: Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
          document.body.offsetHeight - 300 &&
        !loading &&
        hasMore
      ) {
        handleLoadMore();
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loading, hasMore]);

  return (
    <div className="flex flex-col items-center">
      <WarehouseTimeline tracking={tracking} />
      {loading && <div className="text-gray-500 p-3">در حال بارگذاری...</div>}
      {!loading && hasMore && (
        <button
          onClick={handleLoadMore}
          className="px-6 py-2 mt-3 mb-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          بارگذاری بیشتر
        </button>
      )}
      {!hasMore && (
        <div className="text-gray-400 mt-2 mb-4">همه تراکنش‌ها نمایش داده شدند.</div>
      )}
    </div>
  );
}
