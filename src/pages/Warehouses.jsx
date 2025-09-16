import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { canSeeWarehouses } from "../api/auth";
import DashboardLayout from "../layouts/DashboardLayout";


// Lightweight badge component
const Badge = ({ children, variant = "default" }) => {
  const base =
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";
  const styles = {
    default: "bg-gray-100 text-gray-800",
    success: "bg-green-100 text-green-700",
    warning: "bg-amber-100 text-amber-700",
    info: "bg-blue-100 text-blue-700",
    violet: "bg-violet-100 text-violet-700",
  };
  return <span className={`${base} ${styles[variant] || styles.default}`}>{children}</span>;
};

// Skeleton card for loading state
const WarehouseCardSkeleton = () => (
  <div className="animate-pulse rounded-2xl border border-gray-200 bg-white/60 p-4 shadow-sm">
    <div className="mb-3 h-4 w-28 rounded bg-gray-200" />
    <div className="mb-2 h-6 w-2/3 rounded bg-gray-200" />
    <div className="mb-4 h-4 w-1/2 rounded bg-gray-200" />
    <div className="flex gap-2">
      <div className="h-6 w-16 rounded-full bg-gray-200" />
      <div className="h-6 w-24 rounded-full bg-gray-200" />
    </div>
  </div>
);

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI state
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all"); // all | physical | virtual
  const [sortBy, setSortBy] = useState("name"); // name | code | type

  useEffect(() => {
    let alive = true;
    async function fetchWarehouses() {
      try {
        setLoading(true);
        setError(null);
        const { data } = await api.get("/inv/warehouse");
        if (!alive) return;
        setWarehouses(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!alive) return;
        setError("بارگذاری انبارها با خطا مواجه شد.");
      } finally {
        if (alive) setLoading(false);
      }
    }
    fetchWarehouses();
    return () => {
      alive = false;
    };
  }, []);

  // Access control ("can see" should allow access; fix logic)
  if (canSeeWarehouses()) {
    return (
      <section className="mx-auto max-w-6xl p-6">
        <div className="rounded-3xl border border-red-100 bg-red-50 p-8 text-red-800 shadow">
          <div className="mb-2 text-xl font-bold">دسترسی غیرمجاز</div>
          <p className="mb-4 text-sm text-red-700">
            شما مجوز مشاهده این صفحه را ندارید. در صورت نیاز با مدیر سیستم تماس بگیرید.
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            بازگشت به خانه
          </Link>
        </div>
      </section>
    );
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = [...warehouses];

    if (q) {
      list = list.filter((w) => {
        const name = String(w.name || "").toLowerCase();
        const code = String(w.code || "").toLowerCase();
        const type = String(w.type?.name || w.type || "").toLowerCase();
        return name.includes(q) || code.includes(q) || type.includes(q);
      });
    }

    if (typeFilter !== "all") {
      const wantVirtual = typeFilter === "virtual";
      list = list.filter((w) => Boolean(w.is_virtual) === wantVirtual);
    }

    list.sort((a, b) => {
      const av =
        sortBy === "code"
          ? (a.code || "").toLowerCase()
          : sortBy === "type"
          ? (a.type?.name || a.type || "").toLowerCase()
          : (a.name || "").toLowerCase();
      const bv =
        sortBy === "code"
          ? (b.code || "").toLowerCase()
          : sortBy === "type"
          ? (b.type?.name || b.type || "").toLowerCase()
          : (b.name || "").toLowerCase();
      return av.localeCompare(bv, undefined, { numeric: true, sensitivity: "base" });
    });

    return list;
  }, [warehouses, query, typeFilter, sortBy]);

  const EmptyState = () => (
    <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-12 text-center shadow-sm">
      <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-gray-100" />
      <h3 className="mb-2 text-lg font-bold text-gray-900">هیچ انباری ثبت نشده است</h3>
      <p className="mx-auto mb-6 max-w-md text-sm text-gray-600">
        از دکمه «ایجاد انبار» برای افزودن اولین انبار استفاده کنید یا بعداً دوباره تلاش کنید.
      </p>
      <Link
        to="/inv/warehouse/new"
        className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black"
      >
        + ایجاد انبار
      </Link>
    </div>
  );

  return (

        <DashboardLayout>
      
    <main className="mx-auto max-w-7xl p-6" dir="rtl">
      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">مدیریت انبارها</h1>
          <p className="mt-1 text-sm text-gray-600">جستجو، فیلتر و مرور انبارهای فیزیکی و مجازی.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/inv/warehouse/new"
            className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-black"
          >
            + ایجاد انبار
          </Link>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="relative">
          <input
            type="text"
            placeholder="جستجو بر اساس نام، کد یا نوع..."
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none ring-2 ring-transparent transition focus:border-gray-300 focus:ring-gray-100"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-gray-300 focus:outline-none"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="all">همه نوع‌ها</option>
          <option value="physical">فیزیکی</option>
          <option value="virtual">مجازی</option>
        </select>
        <select
          className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-gray-300 focus:outline-none"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="name">مرتب‌سازی: نام</option>
          <option value="code">مرتب‌سازی: کد</option>
          <option value="type">مرتب‌سازی: نوع</option>
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <WarehouseCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-800">
          <div className="mb-1 text-base font-bold">خطا در دریافت اطلاعات</div>
          <p className="mb-4 text-sm text-red-700">{error}</p>
          <button
            onClick={() => {
              // retry
              setLoading(true);
              setError(null);
              api
                .get("/inv/warehouse")
                .then(({ data }) => setWarehouses(Array.isArray(data) ? data : []))
                .catch(() => setError("بارگذاری انبارها با خطا مواجه شد."))
                .finally(() => setLoading(false));
            }}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            تلاش مجدد
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((w) => (
            <article
              key={w.id}
              className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="mb-1 flex items-center justify-between">
                <Badge variant={w.is_virtual ? "violet" : "success"}>
                  {w.is_virtual ? "مجازی" : "فیزیکی"}
                </Badge>
                {w.type?.name && <Badge variant="info">نوع: {w.type.name}</Badge>}
              </div>

              <h3 className="mb-1 line-clamp-1 text-lg font-bold text-gray-900">
                {w.name || "—"}
              </h3>
              <p className="mb-4 text-sm text-gray-500">کد: {w.code || "—"}</p>

              {w.description && (
                <p className="mb-4 line-clamp-2 text-sm text-gray-700">{w.description}</p>
              )}

              <div className="flex items-center justify-between">
                <Link
                  to={`/inv/warehouse/${w.id}`}
                  className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
                >
                  جزئیات
                </Link>
                <div className="text-xs text-gray-400">شناسه: {w.id}</div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
       </DashboardLayout>
  );
}
