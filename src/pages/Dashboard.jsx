// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import { logout } from "../api/auth";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";

import UserCard from "../components/UserCard";

function UserCardSkeleton() {
  return (
    <div dir="rtl" className="bg-white shadow rounded-lg p-4 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-gray-200" />
        <div className="space-y-2">
          <div className="h-4 w-40 bg-gray-200 rounded" />
          <div className="h-3 w-24 bg-gray-200 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="h-3 w-20 bg-gray-200 rounded" />
        <div className="h-3 w-36 bg-gray-200 rounded" />
        <div className="h-3 w-24 bg-gray-200 rounded" />
        <div className="h-3 w-28 bg-gray-200 rounded" />
      </div>
    </div>
  );
}

/* ---------------- محتوای داشبورد ---------------- */
function DashboardHome() {
  const [me, setMe] = useState(null);
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;
    api
      .get("/auth/user")
      .then(({ data }) => alive && setMe(data))
      .catch((e) =>
        alive && setErr(e?.response?.data?.detail || "خطا در دریافت اطلاعات")
      );
    return () => {
      alive = false;
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex-1 p-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold"></h1>
        <button className="text-red-600 hover:underline" onClick={handleLogout}>
          خروج
        </button>
      </div>

      {err && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">{err}</div>
      )}

      <h2 className="text-lg font-semibold mb-3">اطلاعات کاربری</h2>
      {me ? <UserCard user={me} /> : <UserCardSkeleton />}
    </div>
  );
}

/* ---------------- Layout: سایدبار راست + محتوا ---------------- */
export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* دکمه باز و بسته کردن سایدبار */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-2 right-1 z-50 p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none"
      >
        {isSidebarOpen ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        )}
      </button>

      {/* سایدبار با قابلیت باز و بسته شدن */}
      <aside
        className={`fixed top-0 right-0 w-64 h-screen bg-white border-l transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "translate-x-full"
        } lg:translate-x-0 lg:static lg:w-64 lg:shrink-0 z-40`}
      >
        <Sidebar />
      </aside>

      {/* لایه پس‌زمینه برای موبایل هنگام باز بودن سایدبار */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* محتوا؛ فقط این بخش با ناوبری تغییر می‌کند */}
      <DashboardHome />
    </div>
  );
}