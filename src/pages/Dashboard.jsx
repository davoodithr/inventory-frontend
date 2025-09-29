import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import { logout } from "../api/auth";
import { useNavigate } from "react-router-dom";
import UserCard from "../components/UserCard";
import DashboardLayout from "../layouts/DashboardLayout";

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

export default function Dashboard() {
  const [me, setMe] = useState(null);
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;
    api.get("/auth/user")
      .then(({ data }) => alive && setMe(data))
      .catch((e) => alive && setErr(e?.response?.data?.detail || "خطا در دریافت اطلاعات"));
    return () => { alive = false; };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <DashboardLayout
      title="."
      subtitle="نمای کلی اطلاعات کاربری و سیستم"
      actions={
        <button className="text-red-600 hover:underline" onClick={handleLogout}>
          خروج
        </button>
      }
    >
      {err && <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">{err}</div>}
      <h2 className="text-lg font-semibold mb-3">اطلاعات کاربری</h2>
      {me ? <UserCard user={me} /> : <UserCardSkeleton />}
    </DashboardLayout>
  );
}
