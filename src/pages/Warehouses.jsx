import React from "react";
import { canSeeWarehouses } from "../api/useRole";
import useRole from "../api/useRole";
import { Link } from 'react-router-dom';

export default function Warehouses() {
  const { role, isSuper } = useRole();
  const allowed = canSeeWarehouses(role, isSuper);

  if (!allowed) {
    return null; // or render some message or redirect here
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Hello World</h1>
      <p>Welcome to the simple React component example.</p>
    </div>
  );
}

