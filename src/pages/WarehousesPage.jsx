import React from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import Warehouses from "./Warehouses"; 

export default function WarehousesPage() {
  return (
    <DashboardLayout
      title="انبارها"
      subtitle="مشاهده، جستجو و مدیریت انبارهای فیزیکی و مجازی"
      actions={
        <Link
          to="/inv/warehouse/new"
          className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-black"
        >
          + ایجاد انبار
        </Link>
      }
    >
      <Warehouses />
    </DashboardLayout>
  );
}
