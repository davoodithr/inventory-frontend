// src\pages\WarehouseTransactions.jsx

import React, { useEffect, useMemo, useState } from "react";
import { fetchWarehouseTracking, fetchWarehouseTrackingPage } from "../api/client";

const WarehouseTransactions = ({ warehouseId, query = "", trxType = "all", usage = "all", productType = "all", isApprove = "all" }) => {
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ count: 0, next: null, previous: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  useEffect(() => {
    let alive = true;
    async function fetchData() {
      try {
        setLoading(true);
        setError("");
        const data = await fetchWarehouseTracking(warehouseId, currentPage);
        if (!alive) return;
        setTransactions(data.tracking_history || []);
        setPagination({
          count: data.count || 0,
          next: data.next,
          previous: data.previous,
        });
      } catch (err) {
        if (!alive) return;
        setError("خطا در دریافت اطلاعات تراکنش‌ها");
        console.error("Failed to fetch transactions", err);
      } finally {
        if (alive) setLoading(false);
      }
    }
    fetchData();
    return () => { alive = false; };
  }, [warehouseId, currentPage]);

  const handlePageChange = async (urlOrPage) => {
    let url = urlOrPage;
    if (typeof urlOrPage === "number") {
      url = `/inv/inventory-tracking/${warehouseId}/warehouse/?page=${urlOrPage}`;
    }
    if (!url) return;
    try {
      setLoading(true);
      setError("");
      const data = await fetchWarehouseTrackingPage(url);
      setTransactions(data.tracking_history || []);
      setPagination({
        count: data.count || 0,
        next: data.next,
        previous: data.previous,
      });
      const pageMatch = url.match(/page=(\d+)/);
      setCurrentPage(pageMatch ? parseInt(pageMatch[1]) : 1);
    } catch (err) {
      setError("خطا در بارگذاری صفحه");
      console.error("Failed to fetch page", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = useMemo(() => {
    let list = [...transactions];

    if (query.trim()) {
      const needle = query.trim().toLowerCase();
      list = list.filter((t) =>
        String(t.product_name || "").toLowerCase().includes(needle) ||
        String(t.ref || "").toLowerCase().includes(needle)
      );
    }

    if (trxType !== "all") {
      list = list.filter((t) => t.trx_type === trxType);
    }

    if (usage !== "all") {
      list = list.filter((t) => t.usage_type === usage);
    }

    if (productType !== "all") {
      list = list.filter((t) => t.product_type === productType);
    }

    if (isApprove !== "all") {
      list = list.filter((t) => t.is_approve === (isApprove === "true"));
    }

    return list;
  }, [transactions, query, trxType, usage, productType, isApprove]);

  const TRX_TYPE_LABELS = {
    in: "ورود",
    out: "خروج",
    move: "انتقال",
    produce: "تولید",
    consume: "مصرف",
    scrap: "ضایعات",
    adjust: "اصلاح موجودی",
  };

  const USAGE_TYPE_LABELS = {
    production: "تولید",
    test: "تست",
    engineering: "مهندسی",
    rework: "بازکاری",
    normal: "عادی",
  };

  // Calculate last page (assuming 10 items per page, standard for Django's StandardPagination)
  const pageSize = 10;
  const lastPage = Math.ceil(pagination.count / pageSize);

  const openDetails = (transaction) => {
    setSelectedTransaction(transaction);
  };

  const closeDetails = () => {
    setSelectedTransaction(null);
  };

  if (loading) {
    return <div className="py-8 text-center text-gray-500">در حال بارگذاری...</div>;
  }

  if (error) {
    return (
      <div className="py-8 text-center text-red-600">
        <div className="mb-1 text-base font-bold">خطا</div>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      {/* Transactions Table */}
      {filteredTransactions.length > 0 ? (
        <div>
          <h3 className="mb-4 text-lg font-semibold text-gray-900">تراکنش‌های انبار</h3>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">شناسه</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تاریخ</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">محصول</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">نوع تراکنش</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">نوع استفاده</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">مقدار</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تغییر موجودی</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">از انبار</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">به انبار</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تایید شده؟</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">جزئیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTransactions.map((t) => (
                <tr
                  key={t.id}
                  className="hover:bg-gray-100 cursor-pointer transition"
                  onClick={() => openDetails(t)}
                >
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{t.id}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {new Date(t.created_at).toLocaleString("fa-IR", { dateStyle: "short", timeStyle: "short" })}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {t.product_name} ({t.product_type === "component" ? "قطعه" : "مونتاژی"})
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{TRX_TYPE_LABELS[t.trx_type] || t.trx_type}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{USAGE_TYPE_LABELS[t.usage_type] || t.usage_type}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{t.qty}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{t.balance_change}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{t.from_wh?.name || "—"}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{t.to_wh?.name || "—"}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        t.is_approve ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {t.is_approve ? "بله" : "خیر"}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    <button
                      className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDetails(t);
                      }}
                    >
                      جزئیات
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-8 text-center text-gray-500">هیچ تراکنشی یافت نشد</div>
      )}

      {/* Modal for Transaction Details */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">جزئیات تراکنش #{selectedTransaction.id}</h4>
            <div className="space-y-3">
              <div>
                <span className="font-medium text-gray-700">مرجع: </span>
                <span className="text-gray-500">{selectedTransaction.ref || "—"}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">یادداشت: </span>
                <span className="text-gray-500">{selectedTransaction.note || "—"}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">وضعیت تایید: </span>
                <div className="flex flex-col gap-2 mt-1">
                  <div>
                    <span className="font-medium">تایید شده؟: </span>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        selectedTransaction.is_approve ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {selectedTransaction.is_approve ? "بله" : "خیر"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">تاییدکننده: </span>
                    <span className="text-gray-500">{selectedTransaction.is_approve_by || "—"}</span>
                  </div>
                  <div>
                    <span className="font-medium">تایید QC؟: </span>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        selectedTransaction.is_qc_approve ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {selectedTransaction.is_qc_approve ? "بله" : "خیر"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                className="px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-lg hover:bg-gray-700"
                onClick={closeDetails}
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.count > 0 && (
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-gray-500">
            نمایش {filteredTransactions.length} از {pagination.count} تراکنش (صفحه {currentPage} از {lastPage})
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className={`px-4 py-2 text-sm font-semibold rounded-lg ${
                currentPage === 1 ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-gray-900 text-white hover:bg-gray-800"
              }`}
            >
              اولین
            </button>
            <button
              onClick={() => handlePageChange(pagination.previous)}
              disabled={!pagination.previous}
              className={`px-4 py-2 text-sm font-semibold rounded-lg ${
                pagination.previous ? "bg-gray-900 text-white hover:bg-gray-800" : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              قبلی
            </button>
            <button
              onClick={() => handlePageChange(pagination.next)}
              disabled={!pagination.next}
              className={`px-4 py-2 text-sm font-semibold rounded-lg ${
                pagination.next ? "bg-gray-900 text-white hover:bg-gray-800" : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              بعدی
            </button>
            <button
              onClick={() => handlePageChange(lastPage)}
              disabled={currentPage === lastPage}
              className={`px-4 py-2 text-sm font-semibold rounded-lg ${
                currentPage === lastPage ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-gray-900 text-white hover:bg-gray-800"
              }`}
            >
              آخرین
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WarehouseTransactions;