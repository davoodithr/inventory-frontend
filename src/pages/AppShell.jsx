// pages/AppShell.jsx
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

export default function AppShell() {
  return (
    <div className="min-h-screen flex flex-row-reverse bg-gray-50">
      <aside className="w-64 shrink-0 bg-white border-l h-screen sticky top-0">
        <Sidebar />
      </aside>
      <main className="flex-1 overflow-y-auto">
        <Outlet /> {/* child routes render here */}
      </main>
    </div>
  );
}
