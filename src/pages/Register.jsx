// src/pages/Register.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../api/auth";
import { storage } from "../api/client";

/* ---------- Icons ---------- */
const IconUser  = () => (
  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
    <path d="M10 10a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4 0-7 2-7 4v1h14v-1c0-2-3-4-7-4Z"/>
  </svg>
);
const IconAt    = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 3a9 9 0 1 0 9 9v-1a1 1 0 1 0-2 0v1a7 7 0 1 1-2.05-4.95A5 5 0 0 0 19 13a3 3 0 0 1-6 0V8a1 1 0 1 1 2 0v5a1 1 0 0 0 2 0 5 5 0 1 0-5-10Z"/>
  </svg>
);
const IconMail  = () => (
  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
    <path d="M2.94 5.5A2 2 0 0 1 4.9 4h10.2a2 2 0 0 1 1.96 1.5L10 10.5 2.94 5.5Z"/>
    <path d="M2 7.1V14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.1l-8 5.4-8-5.4Z"/>
  </svg>
);
const IconLock  = () => (
  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
    <path d="M5 8V6a5 5 0 1 1 10 0v2h1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1h1Zm2 0h6V6a3 3 0 1 0-6 0v2Z"/>
  </svg>
);
const IconEye   = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 5c-5 0-9 4-10 7 1 3 5 7 10 7s9-4 10-7c-1-3-5-7-10-7Zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10Z"/>
  </svg>
);
const IconEyeOff= () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="m2 4 18 18-1.4 1.4L16.7 21A11.8 11.8 0 0 1 12 22C7 22 3 18 2 15c.4-.9 1.1-2 2-3.2L.6 5.4 2 4Zm5.9 5.9 1.5 1.5A3 3 0 0 0 12 15a3 3 0 0 0 1.6-.5l1.5 1.5A5 5 0 0 1 7.9 9.9ZM12 6a5 5 0 0 1 5 5c0 .7-.1 1.3-.3 1.9l4.4 4.4c1.2-1.3 2.1-2.7 2.9-4.3-1-3-5-7-10-7-1.1 0-2.1.2-3 .5L12 6Z"/>
  </svg>
);

/* ---------- Reusable Field ---------- */
function Field({
  label,
  name,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  autoComplete,
  dir = "rtl",
  icon,
  inputProps = {},
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
          {icon}
        </span>
        <input
          id={name}
          name={name}
          type={type}
          dir={dir}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className={`w-full rounded-lg border ${error ? "border-red-400" : "border-gray-300"} bg-white pr-3 pl-10 py-2 outline-none focus:ring-2 focus:ring-blue-500`}
          {...inputProps}
        />
      </div>
      {error && <p className="text-xs text-red-600 mt-1">{String(error)}</p>}
    </div>
  );
}

/* ---------- Page ---------- */
export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [topError, setTopError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setTopError("");
    setErrors({});

    try {
      const data = await registerUser({
        username: form.username,
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        password: form.password,
      });

      // If API returns tokens, store them (auto-login)
      if (data?.access && data?.refresh) {
        storage.access = data.access;
        storage.refresh = data.refresh;
        navigate("/dashboard", { replace: true });
        return;
      }

      // Otherwise go to login page after successful register
      navigate("/login", { replace: true });
    } catch (err) {
      // Map common DRF-style errors: { field: ["msg"] } or { detail: "..." }
      const resp = err?.response?.data;
      if (resp && typeof resp === "object") {
        const fieldErrors = { ...errors };
        let general = "";

        Object.entries(resp).forEach(([key, val]) => {
          if (key === "detail" || key === "non_field_errors") {
            general = Array.isArray(val) ? val.join(" ") : String(val);
          } else {
            fieldErrors[key] = Array.isArray(val) ? val[0] : String(val);
          }
        });

        setErrors(fieldErrors);
        setTopError(general || "خطا در ایجاد حساب");
      } else {
        setTopError("خطای شبکه/سرور. بعداً تلاش کنید.");
      }
    } finally {
      setLoading(false);
    }
  };

  /* ---------- The form UI ---------- */
  return (
    <form
      onSubmit={onSubmit}
      dir="rtl"
      className="max-w-md mx-auto p-6 bg-white rounded-xl shadow space-y-4"
    >
      <h1 className="text-xl font-bold text-center">ایجاد حساب کاربری</h1>

      {topError && (
        <div className="bg-red-50 text-red-700 text-sm p-2 rounded">
          {topError}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="نام *"
          name="first_name"
          placeholder="مثال: محمد"
          value={form.first_name}
          onChange={onChange}
          error={errors.first_name}
          icon={<IconUser />}
          autoComplete="given-name"
        />
        <Field
          label="نام خانوادگی *"
          name="last_name"
          placeholder="مثال: داودی"
          value={form.last_name}
          onChange={onChange}
          error={errors.last_name}
          icon={<IconUser />}
          autoComplete="family-name"
        />
      </div>

      <Field
        label="نام کاربری *"
        name="username"
        placeholder="مثال: mohamad123"
        value={form.username}
        onChange={onChange}
        error={errors.username}
        icon={<IconAt />}
        autoComplete="username"
        dir="ltr"
      />

      <Field
        label="ایمیل *"
        name="email"
        type="email"
        placeholder="مثال: mohamad@mail.com"
        value={form.email}
        onChange={onChange}
        error={errors.email}
        icon={<IconMail />}
        autoComplete="email"
        dir="ltr"
        inputProps={{ inputMode: "email" }}
      />

      {/* Password */}
      <div>
        <label htmlFor="password" className="block text-sm text-gray-700 mb-1">
          رمز عبور *
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
            <IconLock />
          </span>
          <input
            id="password"
            name="password"
            type={showPwd ? "text" : "password"}
            value={form.password}
            onChange={onChange}
            autoComplete="new-password"
            placeholder="حداقل ۸ کاراکتر"
            className={`w-full rounded-lg border ${
              errors.password ? "border-red-400" : "border-gray-300"
            } bg-white pr-10 pl-10 py-2 outline-none focus:ring-2 focus:ring-blue-500`}
          />
          <button
            type="button"
            onClick={() => setShowPwd((s) => !s)}
            className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
            aria-label={showPwd ? "پنهان کردن رمز" : "نمایش رمز"}
            title={showPwd ? "پنهان کردن رمز" : "نمایش رمز"}
          >
            {showPwd ? <IconEyeOff /> : <IconEye />}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-red-600 mt-1">{String(errors.password)}</p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          حداقل ۸ کاراکتر؛ بهتر است ترکیبی از حروف بزرگ/کوچک و اعداد باشد.
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
      >
        {loading ? "در حال ایجاد حساب..." : "ایجاد حساب"}
      </button>

      <p className="text-sm text-center text-gray-600">
        حساب دارید؟{" "}
        <Link to="/login" className="text-blue-600 hover:underline">
          وارد شوید
        </Link>
      </p>
    </form>
  );
}
