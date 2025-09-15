
import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaChartBar, FaWarehouse, FaCubes, FaExchangeAlt, FaIndustry, FaVials, FaShoppingCart, FaClipboardList, FaCog } from 'react-icons/fa';

const Sidebar = () => {
  const navItems = [
    { path: '/dashboard', label: 'داشبورد کلی', icon: <FaChartBar /> },
    { path: '/warehouses', label: 'انبارها', icon: <FaWarehouse /> },
    { path: '/products', label: 'کالاها و محصولات', icon: <FaCubes /> },
    { path: '/transfers', label: 'انتقالات بین انبار', icon: <FaExchangeAlt /> },
    { path: '/production', label: 'برنامه‌ریزی تولید', icon: <FaIndustry /> },
    { path: '/quality', label: 'کنترل کیفیت', icon: <FaVials /> },
    { path: '/purchase', label: 'خرید و تامین', icon: <FaShoppingCart /> },
    { path: '/reports', label: 'گزارش‌ها و تاریخچه', icon: <FaClipboardList /> },
    { path: '/settings', label: 'تنظیمات کاربران', icon: <FaCog /> },
  ];

  return (
    <div className="h-screen bg-gray-800 text-white w-64 flex flex-col">
      <div className="text-center text-2xl font-bold py-6 border-b border-gray-700">
        انبار به انبار
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${
                isActive ? 'bg-gray-700' : 'hover:bg-gray-700'
              }`
            }
          >
            <span className="text-lg">{item.icon}</span>
            <span className="text-sm">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
