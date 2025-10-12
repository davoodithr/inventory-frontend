import React, { useEffect, useState } from "react";
import { api } from "../api/client";

const CreateTransaction = ({ warehouseId, onClose, onSuccess }) => {
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [formData, setFormData] = useState({
    product: "",
    to_wh: "",
    qty: "",
    trx_type: "in",
    usage_type: "normal",
    ref: "",
    note: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ general: "", fields: {} });
  const [success, setSuccess] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);

  // Fetch available products and warehouses
  useEffect(() => {
    let alive = true;
    async function fetchData() {
      try {
        setLoading(true);
        setErrors({ general: "", fields: {} });

        console.log(`Fetching products for warehouse ${warehouseId}...`);
        const productResponse = await api.get(`/inv/warehouse/${warehouseId}/products/`);
        if (!alive) return;
        console.log("Products API response:", productResponse);
        console.log("Products API response data:", productResponse.data);
        let productData = [];
        if (Array.isArray(productResponse.data)) {
          productData = productResponse.data;
        } else if (Array.isArray(productResponse.data?.results)) {
          productData = productResponse.data.results;
        } else if (Array.isArray(productResponse.data?.data)) {
          productData = productResponse.data.data;
        } else {
          console.warn("Unexpected products response format:", productResponse.data);
          setErrors({ general: "فرمت پاسخ محصولات نامعتبر است", fields: {} });
        }
        console.log("Parsed products:", productData);
        setProducts(productData);
        console.log("Set products state:", productData);

        console.log("Fetching warehouses...");
        const warehouseResponse = await api.get("/inv/warehouses-all/");
        if (!alive) return;
        console.log("Warehouses API response:", warehouseResponse);
        console.log("Warehouses API response data:", warehouseResponse.data);
        let warehouseData = [];
        if (Array.isArray(warehouseResponse.data?.results)) {
          warehouseData = warehouseResponse.data.results;
        } else if (Array.isArray(warehouseResponse.data)) {
          warehouseData = warehouseResponse.data;
        } else {
          console.warn("Unexpected warehouses response format:", warehouseResponse.data);
          setErrors({ general: "فرمت پاسخ انبارها نامعتبر است", fields: {} });
        }
        console.log("Parsed warehouses:", warehouseData);
        setWarehouses(warehouseData.filter((w) => w.id !== warehouseId));
        console.log("Set warehouses state:", warehouseData.filter((w) => w.id !== warehouseId));
      } catch (err) {
        if (!alive) return;
        setErrors({
          general: err.response?.data?.detail || "خطا در دریافت محصولات یا انبارها",
          fields: {},
        });
        console.error("Failed to fetch data:", err);
        console.log("Error response:", err.response);
      } finally {
        if (alive) setLoading(false);
      }
    }
    fetchData();
    return () => { alive = false; };
  }, [warehouseId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field-specific error when user starts typing
    setErrors((prev) => ({
      ...prev,
      fields: { ...prev.fields, [name]: "" },
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({ general: "", fields: {} });
    setSuccess("");

    const payload = {
      product: Number(formData.product),
      from_wh: warehouseId,
      to_wh: formData.to_wh ? Number(formData.to_wh) : null,
      qty: Number(formData.qty),
      trx_type: formData.trx_type,
      usage_type: formData.usage_type,
      ref: formData.ref || null,
      note: formData.note || null,
    };

    console.log("Preparing transaction:", payload);
    setPendingPayload(payload);
    setShowConfirmModal(true);
  };

  const confirmSubmit = async () => {
    setShowConfirmModal(false);
    setLoading(true);

    try {
      console.log("Submitting transaction:", pendingPayload);
      const response = await api.post("/inv/create-inventory-transactions/", pendingPayload);
      console.log("Transaction creation response:", response.data);
      setSuccess("تراکنش با موفقیت ایجاد شد!");
      setFormData({
        product: "",
        to_wh: "",
        qty: "",
        trx_type: "in",
        usage_type: "normal",
        ref: "",
        note: "",
      });
      setPendingPayload(null);
      onSuccess();
    } catch (err) {
      let generalError = "";
      let fieldErrors = {};
      if (err.response?.data) {
        console.log("Transaction error response:", err.response.data);
        if (Array.isArray(err.response.data?.non_field_errors)) {
          const errorMsg = err.response.data.non_field_errors.join(", ");
          if (
            errorMsg.includes("This product has no quantity in this warehouse") ||
            errorMsg.includes("This product is not exist in this warehouse")
          ) {
            fieldErrors.product = errorMsg;
          } else if (errorMsg.includes("no default UOM")) {
            fieldErrors.uom = errorMsg;
          } else {
            generalError = errorMsg;
          }
        } else if (typeof err.response.data === "object" && !Array.isArray(err.response.data)) {
          fieldErrors = Object.keys(err.response.data).reduce((acc, key) => {
            acc[key] = Array.isArray(err.response.data[key])
              ? err.response.data[key].join(", ")
              : err.response.data[key];
            return acc;
          }, {});
        } else if (err.response.data?.detail) {
          generalError = err.response.data.detail;
        } else {
          generalError = "خطا در ایجاد تراکنش";
        }
      } else {
        generalError = "خطا در ایجاد تراکنش";
      }
      setErrors({ general: generalError, fields: fieldErrors });
      console.error("Failed to create transaction:", err);
    } finally {
      setLoading(false);
    }
  };

  const cancelConfirm = () => {
    setShowConfirmModal(false);
    setPendingPayload(null);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">ایجاد تراکنش جدید</h4>
          {loading ? (
            <div className="text-center text-gray-500">در حال بارگذاری...</div>
          ) : errors.general ? (
            <div className="mb-4 text-red-600">{errors.general}</div>
          ) : success ? (
            <div className="mb-4 text-green-600">{success}</div>
          ) : null}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">محصول</label>
              <select
                name="product"
                value={formData.product}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-100"
                required
              >
                <option value="">انتخاب محصول</option>
                {products.length > 0 ? (
                  products.map((p) => (
                    <option key={p.product_id} value={p.product_id}>
                      {p.product_name} 
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    هیچ محصولی در این انبار یافت نشد
                  </option>
                )}
              </select>
              {errors.fields.product && (
                <div className="text-red-600 text-sm mt-1">{errors.fields.product}</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">انبار مقصد</label>
              <select
                name="to_wh"
                value={formData.to_wh}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-100"
              >
                <option value="">بدون انبار مقصد</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.type?.name || "—"})
                  </option>
                ))}
              </select>
              {errors.fields.to_wh && (
                <div className="text-red-600 text-sm mt-1">{errors.fields.to_wh}</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">مقدار</label>
              <input
                type="number"
                name="qty"
                value={formData.qty}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-100"
                min="0"
                step="0.001"
                required
              />
              {errors.fields.qty && (
                <div className="text-red-600 text-sm mt-1">{errors.fields.qty}</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">نوع تراکنش</label>
              <select
                name="trx_type"
                value={formData.trx_type}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-100"
                required
              >
                <option value="in">ورود</option>
                <option value="out">خروج</option>
                <option value="move">انتقال</option>
                <option value="produce">تولید</option>
                <option value="consume">مصرف</option>
                <option value="scrap">ضایعات</option>
                <option value="adjust">اصلاح موجودی</option>
              </select>
              {errors.fields.trx_type && (
                <div className="text-red-600 text-sm mt-1">{errors.fields.trx_type}</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">نوع استفاده</label>
              <select
                name="usage_type"
                value={formData.usage_type}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-100"
                required
              >
                <option value="production">تولید</option>
                <option value="test">تست</option>
                <option value="engineering">مهندسی</option>
                <option value="rework">بازکاری</option>
                <option value="normal">عادی</option>
              </select>
              {errors.fields.usage_type && (
                <div className="text-red-600 text-sm mt-1">{errors.fields.usage_type}</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">مرجع</label>
              <input
                type="text"
                name="ref"
                value={formData.ref}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-100"
              />
              {errors.fields.ref && (
                <div className="text-red-600 text-sm mt-1">{errors.fields.ref}</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">یادداشت</label>
              <textarea
                name="note"
                value={formData.note}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-100"
                rows="4"
              />
              {errors.fields.note && (
                <div className="text-red-600 text-sm mt-1">{errors.fields.note}</div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                لغو
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg ${
                  loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                ایجاد
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">تأیید ایجاد تراکنش</h4>
            <p className="text-sm text-gray-700 mb-6">آیا از ایجاد این تراکنش مطمئن هستید؟</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={cancelConfirm}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                خیر
              </button>
              <button
                onClick={confirmSubmit}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                بله
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CreateTransaction;