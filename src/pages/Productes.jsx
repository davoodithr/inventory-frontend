import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import DashboardLayout from "../layouts/DashboardLayout";

// Badge component
const Badge = ({ children, variant = "default" }) => {
  const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";
  const styles = {
    default: "bg-gray-100 text-gray-800",
    success: "bg-green-100 text-green-700",
    warning: "bg-amber-100 text-amber-700",
    info: "bg-blue-100 text-blue-700",
    violet: "bg-violet-100 text-violet-700",
    obsolete: "bg-red-100 text-red-700",
  };
  return <span className={`${base} ${styles[variant] || styles.default}`}>{children}</span>;
};

// Skeleton for loading
const ProductCardSkeleton = () => (
  <div className="animate-pulse rounded-2xl border border-gray-200 bg-white/60 p-4 shadow-sm">
    <div className="mb-2 h-4 w-28 rounded bg-gray-200" />
    <div className="mb-2 h-6 w-2/3 rounded bg-gray-200" />
    <div className="mb-3 h-4 w-1/2 rounded bg-gray-200" />
    <div className="flex flex-wrap gap-2">
      <div className="h-6 w-16 rounded-full bg-gray-200" />
      <div className="h-6 w-24 rounded-full bg-gray-200" />
    </div>
  </div>
);

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  // Expand/collapse state for BOM
  const [expandedBOM, setExpandedBOM] = useState({}); // key = product.id, value = boolean

  useEffect(() => {
    let alive = true;
    async function fetchProducts() {
      try {
        setLoading(true);
        setError(null);
        const { data } = await api.get("/inv/products/");
        if (!alive) return;
        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!alive) return;
        setError("بارگذاری محصولات با خطا مواجه شد.");
      } finally {
        if (alive) setLoading(false);
      }
    }
    fetchProducts();
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = [...products];

    if (q) {
      list = list.filter(p => {
        const name = String(p.name || "").toLowerCase();
        const barcode = String(p.barcode || "").toLowerCase();
        return name.includes(q) || barcode.includes(q);
      });
    }

    if (typeFilter !== "all") {
      list = list.filter(p => p.product_type === typeFilter);
    }

    list.sort((a, b) => {
      const av =
        sortBy === "code"
          ? (a.barcode || "").toLowerCase()
          : sortBy === "type"
          ? (a.product_type || "").toLowerCase()
          : (a.name || "").toLowerCase();
      const bv =
        sortBy === "code"
          ? (b.barcode || "").toLowerCase()
          : sortBy === "type"
          ? (b.product_type || "").toLowerCase()
          : (b.name || "").toLowerCase();
      return av.localeCompare(bv, undefined, { numeric: true, sensitivity: "base" });
    });

    return list;
  }, [products, query, typeFilter, sortBy]);

  const toggleBOM = (id) => {
    setExpandedBOM(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const EmptyState = () => (
    <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-12 text-center shadow-sm">
      <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-gray-100" />
      <h3 className="mb-2 text-lg font-bold text-gray-900">هیچ محصولی ثبت نشده است</h3>
      <p className="mx-auto mb-6 max-w-md text-sm text-gray-600">
        از دکمه «ایجاد محصول» برای افزودن اولین محصول استفاده کنید یا بعداً دوباره تلاش کنید.
      </p>
      <Link
        to="/inv/products/new"
        className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black"
      >
        + ایجاد محصول
      </Link>
    </div>
  );

  return (
    <DashboardLayout>
      <main className="mx-auto max-w-7xl p-6" dir="rtl">
        {/* Header */}
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">مدیریت محصولات</h1>
            <p className="mt-1 text-sm text-gray-600">جستجو، فیلتر و مرور محصولات و BOM آن‌ها.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/inv/products/new"
              className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-black"
            >
              + ایجاد محصول
            </Link>
          </div>
        </div>

        {/* Toolbar */}
        <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
          <input
            type="text"
            placeholder="جستجو بر اساس نام یا بارکد..."
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-gray-300 focus:ring-gray-100"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <select
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-gray-300 focus:outline-none"
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
          >
            <option value="all">همه نوع‌ها</option>
            <option value="component">Component</option>
            <option value="assembly">Assembly</option>
            <option value="service">Service</option>
          </select>
          <select
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-gray-300 focus:outline-none"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
          >
            <option value="name">مرتب‌سازی: نام</option>
            <option value="code">مرتب‌سازی: بارکد</option>
            <option value="type">مرتب‌سازی: نوع</option>
          </select>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-800">
            <div className="mb-1 text-base font-bold">خطا در دریافت اطلاعات</div>
            <p className="mb-4 text-sm text-red-700">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(p => (
              <article
                key={p.id}
                className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="mb-1 flex items-center gap-2 flex-wrap">
                  <Badge variant={p.product_type === "assembly" ? "info" : p.product_type === "component" ? "success" : "violet"}>
                    {p.product_type}
                  </Badge>
                  {p.status === "obsolete" && <Badge variant="obsolete">منسوخ</Badge>}
                </div>

                <h3 className="mb-1 line-clamp-1 text-lg font-bold text-gray-900">{p.name || "—"}</h3>
                <p className="mb-2 text-sm text-gray-500">بارکد: {p.barcode || "—"}</p>
                {p.serial_number && <p className="mb-2 text-sm text-gray-500">سریال: {p.serial_number}</p>}

                {/* BOM Lines collapsible */}
                {p.components.length > 0 && (
                  <div className="mt-3">
                    <button
                      className="text-sm font-semibold text-blue-600 hover:underline"
                      onClick={() => toggleBOM(p.id)}
                    >
                      {expandedBOM[p.id] ? "بستن BOM" : "نمایش BOM"}
                    </button>
                    {expandedBOM[p.id] && (
                      <ul className="mt-2 space-y-1 text-sm text-gray-600">
                        {p.components.map((c, idx) => (
                          <li key={idx} className="flex justify-between">
                            <span>{c.component_name || c.component}</span>
                            <span>{c.quantity} {c.uom}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                  <div>شناسه: {p.id}</div>
                  <Link
                    to={`/inv/products/${p.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    جزئیات
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </DashboardLayout>
  );
}
