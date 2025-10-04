import React, { useState } from "react";
import Sidebar from "../components/Sidebar";

export default function DashboardLayout({ title, subtitle, actions, children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen((v) => !v);

  return (
    <div className="min-h-screen flex bg-gray-50" dir="rtl">
      {/* Toggle Button (mobile) */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-2 right-4 z-50 p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none"
        aria-label={isSidebarOpen ? "بستن منو" : "باز کردن منو"}
      >
        {isSidebarOpen ? (
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
            <path
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
            <path
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        )}
      </button>

      {/* Sidebar */}
      <aside
        className={`w-64 h-screen bg-white border-l transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 z-40 ${
          isSidebarOpen ? "translate-x-0 fixed top-0 right-0" : "translate-x-full fixed top-0 right-0 lg:translate-x-0"
        }`}
      >
        <Sidebar />
      </aside>

      {/* Backdrop when sidebar open (mobile) */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Page Content */}
      <section
        className={`flex-1 p-6 transition-all duration-300 max-w-full overflow-x-hidden lg:mr-64 ${
          isSidebarOpen ? "mr-64" : "mr-0"
        }`}
      >
        {(title || actions || subtitle) && (
          <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              {title && <h1 className="text-2xl font-bold text-gray-900">{title}</h1>}
              {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
            </div>
            {actions}
          </div>
        )}
        <div className="rounded-3xl bg-white border border-gray-200 p-4 shadow-sm max-w-full">
          {children}
        </div>
      </section>
    </div>
  );
}