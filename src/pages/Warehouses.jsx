// src\pages\Warehouses.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { canSeeWarehouses } from "../api/auth";
import DashboardLayout from "../layouts/DashboardLayout";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

// ثبت اجزای Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

// کامپوننت جدید: گزارش کلی بالانس مواد خام (نمایش به‌صورت جدول)
const RawMaterialBalanceReport = () => {
  const [balanceData, setBalanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSystemBalance = async () => {
      setLoading(true);
      setError(null);
      try {
        // درخواست به API جدید برای گزارش کلی
        const { data } = await api.get(`/inv/raw-material-balance/`);
        setBalanceData(data.sort((a, b) => (a.product_name || "").localeCompare(b.product_name || "")));
      } catch (err) {
        console.error("خطا در دریافت بالانس مواد خام", err);
        setError("خطا در بارگذاری گزارش بالانس مواد خام");
      } finally {
        setLoading(false);
      }
    };

    fetchSystemBalance();
  }, []);

  if (loading) {
    return (
      <div className="col-span-full h-32 flex items-center justify-center text-gray-500">
        در حال بارگذاری گزارش بالانس مواد خام...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-800">
        <div className="mb-1 text-base font-bold">خطا در دریافت اطلاعات</div>
        <p className="mb-4 text-sm text-red-700">{error}</p>
      </div>
    );
  }

  if (balanceData.length === 0) {
    return (
      <div className="text-center text-gray-500">
        هیچ ماده اولیه‌ای یافت نشد یا دسترسی ندارید
      </div>
    );
  }

  return (
    <div className="mb-8" dir="rtl">
      <h2 className="text-xl font-bold text-gray-900 mb-4">گزارش کلی بالانس مواد خام</h2>
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-sm font-semibold text-gray-900 border-b">نام ماده اولیه</th>
                <th className="px-4 py-2 text-sm font-semibold text-gray-900 border-b">موجودی</th>
                <th className="px-4 py-2 text-sm font-semibold text-gray-900 border-b">مصرف‌شده</th>
                <th className="px-4 py-2 text-sm font-semibold text-gray-900 border-b">کل</th>
                <th className="px-4 py-2 text-sm font-semibold text-gray-900 border-b">جزئیات مصرف</th>
              </tr>
            </thead>
            <tbody>
              {balanceData.map((item) => (
                <tr key={item.product_id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm text-gray-700">
                    <span dir="rtl">{item.product_name}</span>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">{item.stock_qty.toLocaleString("fa")}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{item.used_in_products.toLocaleString("fa")}</td>
                  <td className="px-4 py-2 text-sm">
                    <span className={item.overall_bom < 0 ? "text-red-600" : "text-green-600"}>
                      {item.overall_bom.toLocaleString("fa")}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm">
                   {item.used_in_products_details.filter(detail => detail.used_qty > 0).length > 0 ? (
                      <details className="relative">
                        <summary className="cursor-pointer text-blue-600 hover:underline">نمایش جزئیات</summary>
                        <div className="mt-2 text-gray-600">
                          <ul className="list-disc list-inside space-y-1">
                            {item.used_in_products_details
                              .filter(detail => detail.used_qty > 0)
                              .map((detail, idx) => (
                                <li key={idx}>
                                  <span dir="ltr" className="font-mono">{detail.finished_product_name}</span>: {detail.used_qty.toLocaleString("fa")} (هر واحد: {detail.per_unit_qty.toLocaleString("fa")}، ضایعات: {detail.scrap_factor_pct.toLocaleString("fa")}٪، موجودی محصول: {detail.product_stock_qty.toLocaleString("fa")})
                                </li>
                              ))}
                          </ul>
                        </div>
                      </details>
                    ) : (
                      <span className="text-gray-500">بدون جزئیات</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// کامپوننت خلاصه کلی ( نمای سلسله‌مراتبی: نمودار دایره‌ای انبارها و محصولات)
const OverallSummary = ({ warehouses }) => {
  const [overallData, setOverallData] = useState({ warehouseTotals: [], overallProducts: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllInventories = async () => {
      if (warehouses.length === 0) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const warehouseTotals = [];
      const productMap = new Map(); // جمع‌آوری بر اساس product_id

      try {
        const promises = warehouses.map(async (w) => {
          const { data } = await api.get(`/inv/warehouse/${w.id}/overall/`);
          const totalQty = [...data.components, ...data.assemblies].reduce((sum, item) => sum + item.total_qty, 0);
          warehouseTotals.push({ id: w.id, name: w.name, total_qty: totalQty });

          // جمع‌آوری محصولات (قطعات و محصولات مونتاژی)
          [...data.components, ...data.assemblies].forEach((item) => {
            const key = item.product_id;
            if (!productMap.has(key)) {
              productMap.set(key, { product_id: key, name: item.name, total_qty: 0 });
            }
            productMap.get(key).total_qty += item.total_qty;
          });
        });

        await Promise.all(promises);
        setOverallData({
          warehouseTotals,
          overallProducts: Array.from(productMap.values()).sort((a, b) => b.total_qty - a.total_qty),
        });
      } catch (err) {
        console.error("خطا در دریافت موجودی کلی", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllInventories();
  }, [warehouses]);

  const warehouseChartData = useMemo(() => {
    if (loading || overallData.warehouseTotals.length === 0) return null;

    // مرتب‌سازی بر اساس total_qty به‌صورت نزولی، ۵ مورد برتر + سایر
    let items = [...overallData.warehouseTotals].sort((a, b) => b.total_qty - a.total_qty);
    const topItems = items.slice(0, 5);
    const othersSum = items.slice(5).reduce((sum, item) => sum + item.total_qty, 0);

    let processedItems = topItems.map((w) => ({
      label: w.name,
      value: w.total_qty,
      backgroundColor: `hsl(${Math.random() * 360}, 70%, 50%)`, // رنگ‌های متمایز تصادفی
    }));

    return {
      labels: processedItems.map((p) => p.label),
      datasets: [{ data: processedItems.map((p) => p.value), backgroundColor: processedItems.map((p) => p.backgroundColor) }],
    };
  }, [overallData.warehouseTotals, loading]);

  const productsChartData = useMemo(() => {
  if (loading || overallData.overallProducts.length === 0) return null;

  // همه محصولات بدون محدودیت 5 تایی
  let processedItems = overallData.overallProducts.map((p) => ({
    label: p.name,
    value: p.total_qty,
    backgroundColor: `hsl(${Math.random() * 360}, 70%, 50%)`, // رنگ‌های متمایز تصادفی
  }));

  return {
    labels: processedItems.map((p) => p.label),
    datasets: [{ data: processedItems.map((p) => p.value), backgroundColor: processedItems.map((p) => p.backgroundColor) }],
  };
}, [overallData.overallProducts, loading]);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "right",
        align: "center",
        labels: {
          padding: 15,
          usePointStyle: true,
          font: { size: 10, family: "Tahoma, sans-serif" },
          generateLabels: (chart) => {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label, i) => {
                const value = data.datasets[0].data[i];
                const color = data.datasets[0].backgroundColor[i];
                return {
                  text: `${label}: ${value}`,
                  fillStyle: color,
                  strokeStyle: color,
                  lineWidth: 1,
                  hidden: false,
                  index: i,
                };
              });
            }
            return [];
          },
        },
      },
      tooltip: {
        rtl: true,
        callbacks: {
          label: (context) => `${context.label}: ${context.parsed} عدد`,
        },
      },
    },
    maintainAspectRatio: false,
  };

  if (loading) {
    return <div className="col-span-full h-96 flex items-center justify-center text-gray-500">در حال بارگذاری خلاصه کلی...</div>;
  }

  if (overallData.warehouseTotals.length === 0) {
    return <div className="col-span-full text-center text-gray-500">هیچ داده‌ای برای نمایش خلاصه کلی وجود ندارد.</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
      {/* نمودار توزیع انبارها (لایه اول) */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">توزیع انبارها (مجموع موجودی)</h3>
        {warehouseChartData ? (
          <div style={{ height: "300px", position: "relative" }}>
            <Pie data={warehouseChartData} options={chartOptions} />
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">بدون داده</div>
        )}
      </div>

      {/* نمودار توزیع کلی محصولات (لایه دوم - جمع‌شده بر اساس ID) */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">توزیع محصولات کلی (جمع‌شده بر اساس ID)</h3>
        {productsChartData ? (
          <div style={{ height: "300px", position: "relative" }}>
            <Pie data={productsChartData} options={chartOptions} />
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">بدون داده</div>
        )}
      </div>
    </div>
  );
};

// کامپوننت درخت موجودی (نمودار دایره‌ای برای هر انبار)
const InventoryTree = ({ warehouseId }) => {
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/inv/warehouse/${warehouseId}/overall/`);
      setInventory(data);
    } catch (err) {
      console.error("خطا در دریافت موجودی", err);
    } finally {
      setLoading(false);
    }
  };

  const chartData = useMemo(() => {
  if (!inventory) return null;

  let allProducts = [
    ...inventory.assemblies.map((a) => ({
      label: `${a.name} ${a.is_semi_finished ? "(نیم‌ساخت)" : "(تجمیع)"}`,
      value: a.total_qty,
      backgroundColor: a.is_semi_finished ? "#3B82F6" : "#10B981",
    })),
    ...inventory.components.map((c) => ({
      label: `${c.name} (قطعه)`,
      value: c.total_qty,
      backgroundColor: "#F59E0B",
    })),
  ];

  if (allProducts.length === 0) {
    return {
      labels: ["هیچ موردی یافت نشد"],
      datasets: [{ data: [1], backgroundColor: ["#E5E7EB"] }],
    };
  }

  // نمایش همه محصولات بدون "سایر"
  let processedItems = allProducts.sort((a, b) => b.value - a.value);

  return {
    labels: processedItems.map((p) => p.label),
    datasets: [{ data: processedItems.map((p) => p.value), backgroundColor: processedItems.map((p) => p.backgroundColor) }],
  };
}, [inventory]);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "right",
        align: "center",
        labels: {
          padding: 15,
          usePointStyle: true,
          font: { size: 10, family: "Tahoma, sans-serif" },
          generateLabels: (chart) => {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label, i) => {
                const value = data.datasets[0].data[i];
                const color = data.datasets[0].backgroundColor[i];
                return {
                  text: `${label}: ${value}`,
                  fillStyle: color,
                  strokeStyle: color,
                  lineWidth: 1,
                  hidden: false,
                  index: i,
                };
              });
            }
            return [];
          },
        },
      },
      tooltip: {
        rtl: true,
        callbacks: {
          label: (context) => `${context.label}: ${context.parsed} عدد`,
        },
      },
    },
    maintainAspectRatio: false,
  };

  if (!inventory) {
    return (
      <button
        onClick={fetchInventory}
        className="mt-2 rounded-lg bg-blue-100 px-3 py-1 text-sm text-blue-700 hover:bg-blue-200"
      >
        {loading ? "در حال بارگذاری..." : "جزئیات موجودی"}
      </button>
    );
  }

  return (
    <div className="mt-2 text-sm">
      {loading ? (
        <div className="h-64 flex items-center justify-center text-gray-500">در حال بارگذاری...</div>
      ) : chartData ? (
        <div style={{ height: "300px", position: "relative" }}>
          <Pie data={chartData} options={options} />
        </div>
      ) : (
        <div className="text-center text-gray-500">خطا در بارگذاری داده‌ها</div>
      )}
    </div>
  );
};

// کامپوننت نشان (Badge) سبک
const Badge = ({ children, variant = "default" }) => {
  const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";
  const styles = {
    default: "bg-gray-100 text-gray-800",
    success: "bg-green-100 text-green-700",
    warning: "bg-amber-100 text-amber-700",
    info: "bg-blue-100 text-blue-700",
    violet: "bg-violet-100 text-violet-700",
  };
  return <span className={`${base} ${styles[variant] || styles.default}`}>{children}</span>;
};

// کارت اسکلت برای حالت بارگذاری
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

  // حالت‌های رابط کاربری
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  useEffect(() => {
    let alive = true;
    async function fetchWarehouses() {
      try {
        setLoading(true);
        setError(null);
        const { data } = await api.get("/inv/warehouse/");
        if (!alive) return;
        setWarehouses(Array.isArray(data?.results) ? data.results : []);
        console.log("انبارهای دریافت‌شده:", data.results);
      } catch (err) {
        console.error("خطای API:", err);
        if (!alive) return;
        setError("بارگذاری انبارها با خطا مواجه شد.");
      } finally {
        if (alive) setLoading(false);
      }
    }
    fetchWarehouses();
    return () => { alive = false; };
  }, []);

  // بررسی دسترسی
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
        {/* سربرگ */}
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">مدیریت انبارها</h1>
            <p className="mt-1 text-sm text-gray-600">جستجو، فیلتر و مرور انبارهای فیزیکی و مجازی.</p>
          </div>
          <div className="flex items-center gap-2">
            {/* دکمه ایجاد انبار (اختیاری) */}
            {/* <Link
              to="/inv/warehouse/new"
              className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-black"
            >
              + ایجاد انبار
            </Link> */}
          </div>
        </div>

        {/* نوار ابزار */}
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

        {/* محتوا */}
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
                setLoading(true);
                setError(null);
                api
                  .get("/inv/warehouse/")
                  .then(({ data }) => {
                    setWarehouses(Array.isArray(data?.results) ? data.results : []);
                    console.log("تلاش مجدد دریافت:", data.results);
                  })
                  .catch((err) => {
                    console.error("خطای تلاش مجدد:", err);
                    setError("بارگذاری انبارها با خطا مواجه شد.");
                  })
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
          <>
            {/* گزارش کلی بالانس مواد خام */}
            <RawMaterialBalanceReport />

            {/* نمودارهای خلاصه کلی */}
            <OverallSummary warehouses={warehouses} />

            {/* کارت‌های انبارهای جداگانه */}
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

                  <h3 className="mb-1 line-clamp-1 text-lg font-bold text-gray-900">{w.name || "—"}</h3>
                  <p className="mb-4 text-sm text-gray-500">کد: {w.code || "—"}</p>

                  {w.description && <p className="mb-4 line-clamp-2 text-sm text-gray-700">{w.description}</p>}

                  {/* نمودار دایره‌ای موجودی انبار */}
                  <div className="mb-4 border-t border-gray-100 pt-4">
                    <InventoryTree warehouseId={w.id} />
                  </div>

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
          </>
        )}
      </main>
    </DashboardLayout>
  );
}