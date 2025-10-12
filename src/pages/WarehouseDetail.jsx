// \src\pages\WarehouseDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import { fetchWarehouseTracking } from "../api/client";
import WarehouseStock from "./WarehouseStock";
import WarehouseTransactions from "./WarehouseTransactions";
import CreateTransaction from "./CreateTransaction";

// Placeholder components — replace with real ones later
const SankeyReport = () => <div>{/* TODO: Implement SankeyReport */}</div>;
const TreeReport = () => <div>{/* TODO: Implement TreeReport */}</div>;
const WarehouseTimelinePaginated = () => <div>{/* TODO: Implement WarehouseTimelinePaginated */}</div>;

export default function WarehouseDetail() {
  const { id } = useParams();
  const whId = Number(id);

  const [tab, setTab] = useState("stock"); // stock | trx | sankey | tree
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [trackingData, setTrackingData] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [q, setQ] = useState("");
  const [trxType, setTrxType] = useState("all");
  const [usage, setUsage] = useState("all");
  const [dateFromJ, setDateFromJ] = useState("");
  const [dateToJ, setDateToJ] = useState("");
  const [productType, setProductType] = useState("all");

  useEffect(() => {
    let alive = true;
    async function load() {
      if (tab === "trx") {
        try {
          setLoading(true);
          setErr("");
          const data = await fetchWarehouseTracking(whId);
          if (!alive) return;
          setTrackingData(data);
        } catch (e) {
          if (!alive) return;
          setErr("خطا در دریافت اطلاعات");
        } finally {
          if (alive) setLoading(false);
        }
      }
    }
    load();
    return () => { alive = false; };
  }, [tab, whId, refreshKey]);

  const handleTransactionSuccess = () => {
    setShowCreateModal(false);
    setRefreshKey((prev) => prev + 1); // Trigger data refresh
  };

  return (
    <DashboardLayout
      title="جزئیات انبار"
      subtitle={`شناسه انبار: ${whId}`}
      actions={
        <div className="flex gap-2">
          <Link
            to="/inv/warehouses"
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            بازگشت
          </Link>
          <button
            onClick={() => setShowCreateModal(true)}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            ایجاد تراکنش
          </button>
        </div>
      }
    >
      <div className="max-w-full overflow-x-auto" dir="rtl">
        {/* Tabs */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {["stock", "trx", "sankey", "tree"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-xl px-3 py-1.5 text-sm font-semibold ${
                tab === t ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {t === "stock" ? "موجودی" : t === "trx" ? "تراکنش‌ها" : t === "sankey" ? "نمودار انتقال" : "نمودار درختی"}
            </button>
          ))}
        </div>

        {/* Filters for Stock and Transactions Tabs */}
        {(tab === "stock" || tab === "trx") && (
          <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-4">
            <input
              type="text"
              placeholder="جستجو بر اساس نام محصول یا مرجع..."
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none ring-2 ring-transparent transition focus:border-gray-300 focus:ring-gray-100"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <select
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-gray-300 focus:outline-none"
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
            >
              <option value="all">همه انواع</option>
              <option value="component">قطعات (Component)</option>
              <option value="assembly">محصولات مونتاژی (Assembly)</option>
            </select>
            {tab === "trx" && (
              <>
                <select
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-gray-300 focus:outline-none"
                  value={trxType}
                  onChange={(e) => setTrxType(e.target.value)}
                >
                  <option value="all">همه انواع تراکنش</option>
                  <option value="in">ورود</option>
                  <option value="out">خروج</option>
                  <option value="move">انتقال</option>
                  <option value="produce">تولید</option>
                  <option value="consume">مصرف</option>
                  <option value="scrap">ضایعات</option>
                  <option value="adjust">اصلاح موجودی</option>
                </select>
                <select
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-gray-300 focus:outline-none"
                  value={usage}
                  onChange={(e) => setUsage(e.target.value)}
                >
                  <option value="all">همه انواع استفاده</option>
                  <option value="production">تولید</option>
                  <option value="test">تست</option>
                  <option value="engineering">مهندسی</option>
                  <option value="rework">بازکاری</option>
                  <option value="normal">عادی</option>
                </select>
              </>
            )}
          </div>
        )}

        {/* Content */}
        {loading && tab !== "stock" && tab !== "trx" ? (
          <div>در حال بارگذاری...</div>
        ) : err ? (
          <div className="text-red-600">{err}</div>
        ) : tab === "stock" ? (
          <WarehouseStock warehouseId={whId} query={q} productType={productType} />
        ) : tab === "trx" ? (
          <WarehouseTransactions
            warehouseId={whId}
            query={q}
            trxType={trxType}
            usage={usage}
            productType={productType}
          />
        ) : tab === "sankey" ? (
          <SankeyReport />
        ) : (
          <TreeReport />
        )}

        {/* Create Transaction Modal */}
        {showCreateModal && (
          <CreateTransaction
            warehouseId={whId}
            onClose={() => setShowCreateModal(false)}
            onSuccess={handleTransactionSuccess}
          />
        )}
      </div>
    </DashboardLayout>
  );
}