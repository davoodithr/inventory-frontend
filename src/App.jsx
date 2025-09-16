import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import ChangePassword from './pages/ChangePassword.jsx';
import Register from './pages/Register.jsx';
import Warehouses from "./pages/Warehouses.jsx";
import WarehousesPage from "./pages/WarehousesPage";
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/CreateUser" element={<Register />} />
      <Route path="/*" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="ChangePassword" element={<ChangePassword />} />
      <Route path="*" element={<Navigate to="/" replace />} />
      <Route path="/warehouses" element={<ProtectedRoute><Warehouses /></ProtectedRoute>} />
      <Route path="/inv/warehouses" element={<WarehousesPage />} />
    </Routes>
  )
}
