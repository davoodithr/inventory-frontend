// src/pages/WarehouseDetail.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import WarehouseStock from "./WarehouseStock";
import WarehouseTransactions from "./WarehouseTransactions";
import SankeyReport from "./SankeyReport";
import { fetchTransactions, fetchStockQuants } from "../api/client";
import { fromJalaliStr } from "../utils/jalali";

export default function WarehouseDetail() {
  const { id } = useParams();
  const whId = Number(id);

  const [tab, setTab] = useState("stock"); // stock | trx | sankey
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [transactions, setTransactions] = useState([]);
  const [quants, setQuants] = useState([]);

  // Filters
  const [q, setQ] = useState("");
  const [trxType, setTrxType] = useState("all");
  const [usage, setUsage] = useState("all");
  const [dateFromJ, setDateFromJ] = useState("");
  const [dateToJ, setDateToJ] = useState("");

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        setLoading(true);
        setErr("");
        const [trx, sq] = await Promise.all([fetchTransactions(), fetchStockQuants()]);
        if (!alive) return;
        console.log("Fetched transactions:", trx); // Debug: Log fetched transactions
        setTransactions(trx);
        setQuants(sq);
      } catch (e) {
        if (!alive) return;
        setErr("خطا در دریافت اطلاعات موجودی و تراکنش‌ها");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, []);

  // Filtered stock list
  const filteredQuants = useMemo(() => {
    const list = quants.filter((r) => r?.warehouse?.id === whId);
    if (!q.trim()) return list;
    const needle = q.trim().toLowerCase();
    return list.filter((r) => {
      const name = String(r.product?.name || "").toLowerCase();
      const code = String(r.product?.barcode || "").toLowerCase();
      return name.includes(needle) || code.includes(needle);
    });
  }, [quants, whId, q]);

  // Filtered transactions list
  const filteredTrx = useMemo(() => {
    // For sankey tab, include all transactions; otherwise, filter by whId
    let list = tab === "sankey" ? transactions : transactions.filter((t) => t?.from_wh?.id === whId || t?.to_wh?.id === whId);

    if (trxType !== "all") list = list.filter((t) => t.trx_type === trxType);
    if (usage !== "all") list = list.filter((t) => t.usage_type === usage);

    const fromDate = fromJalaliStr(dateFromJ);
    const toDate = (() => {
      const d = fromJalaliStr(dateToJ);
      if (!d) return null;
      d.setHours(23, 59, 59, 999);
      return d;
    })();

    if (fromDate) {
      const fromTs = fromDate.getTime();
      list = list.filter((t) => new Date(t.created_at).getTime() >= fromTs);
    }
    if (toDate) {
      const toTs = toDate.getTime();
      list = list.filter((t) => new Date(t.created_at).getTime() <= toTs);
    }

    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      list = list.filter((t) => {
        const pname = String(t.product?.name || "").toLowerCase();
        const ref = String(t.ref || "").toLowerCase();
        const fromName = String(t.from_wh?.name || "").toLowerCase();
        const toName = String(t.to_wh?.name || "").toLowerCase();
        return pname.includes(needle) || ref.includes(needle) || fromName.includes(needle) || toName.includes(needle);
      });
    }

    console.log("filteredTrx:", list); // Debug: Log filtered transactions
    return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [transactions, whId, tab, trxType, usage, dateFromJ, dateToJ, q]);

  // Transaction badge tone
  const trxTone = (type) =>
    type === "in" ? "blue"
    : type === "out" ? "amber"
    : type === "move" ? "violet"
    : type === "produce" ? "green"
    : type === "consume" ? "red"
    : type === "scrap" ? "red"
    : "gray";

  return (
    <DashboardLayout
      title="جزئیات انبار"
      subtitle={`شناسه انبار: ${whId}`}
      actions={
        <Link
          to="/inv/warehouses"
          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          بازگشت
        </Link>
      }
    >
      {/* Controls */}
      <div className="mb-4 flex flex-col gap-3" dir="rtl">
        {/* Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab("stock")}
            className={`rounded-xl px-3 py-1.5 text-sm font-semibold ${
              tab === "stock" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            موجودی
          </button>
          <button
            onClick={() => setTab("trx")}
            className={`rounded-xl px-3 py-1.5 text-sm font-semibold ${
              tab === "trx" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            تراکنش‌ها
          </button>
          <button
            onClick={() => setTab("sankey")}
            className={`rounded-xl px-3 py-1.5 text-sm font-semibold ${
              tab === "sankey" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            نمودار انتقال
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="flex flex-col">
            <label className="text-xs font-medium text-gray-600">جستجو</label>
            <input
              type="text"
              placeholder="مثلاً: MFD یا 9304..."
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm w-full"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          {tab !== "stock" && (
            <>
              <div className="flex flex-col">
                <label className="text-xs font-medium text-gray-600">نوع تراکنش</label>
                <select
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm w-full"
                  value={trxType}
                  onChange={(e) => setTrxType(e.target.value)}
                >
                  <option value="all">همه</option>
                  <option value="in">ورود</option>
                  <option value="out">خروج</option>
                  <option value="move">انتقال</option>
                  <option value="produce">تولید</option>
                  <option value="consume">مصرف</option>
                  <option value="scrap">ضایعات</option>
                  <option value="adjust">اصلاح موجودی</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-medium text-gray-600">کاربری</label>
                <select
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm w-full"
                  value={usage}
                  onChange={(e) => setUsage(e.target.value)}
                >
                  <option value="all">همه</option>
                  <option value="production">تولید</option>
                  <option value="test">تست</option>
                  <option value="engineering">مهندسی</option>
                  <option value="rework">بازکاری</option>
                  <option value="normal">عادی</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-medium text-gray-600">از تاریخ (شمسی)</label>
                <input
                  type="text"
                  placeholder="YYYY/MM/DD"
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm w-full ltr:text-left"
                  value={dateFromJ}
                  onChange={(e) => setDateFromJ(e.target.value)}
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-medium text-gray-600">تا تاریخ (شمسی)</label>
                <input
                  type="text"
                  placeholder="YYYY/MM/DD"
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm w-full ltr:text-left"
                  value={dateToJ}
                  onChange={(e) => setDateToJ(e.target.value)}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div>در حال بارگذاری...</div>
      ) : err ? (
        <div className="text-red-600">{err}</div>
      ) : tab === "stock" ? (
        <WarehouseStock filteredQuants={filteredQuants} />
      ) : tab === "trx" ? (
        <WarehouseTransactions filteredTrx={filteredTrx} trxTone={trxTone} />
      ) : (
        <SankeyReport
          transactions={filteredTrx}
          filters={{ q, usage, dateFromJ, dateToJ }}
        />
      )}
    </DashboardLayout>
  );
}