// src/components/WarehouseTree.jsx
import React, { useEffect, useState } from "react";
import Tree from "rc-tree";
import "rc-tree/assets/index.css";
import { api } from "../api/client";

export default function WarehouseTree({ warehouseId }) {
  const [treeData, setTreeData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTree() {
      try {
        setLoading(true);
        const { data } = await api.get(`/inv/warehouse/${warehouseId}/overall/`);

        // تبدیل به ساختار درختی
        const assemblies = (data.assemblies || []).map((a) => ({
          key: `assembly-${a.product_id}`,
          title: `${a.name} (تعداد: ${a.total_qty})`,
          children: [],
        }));

        const components = (data.components || []).map((c) => ({
          key: `component-${c.product_id}`,
          title: `${c.name} (تعداد: ${c.total_qty})`,
          isLeaf: true,
        }));

        const root = [
          {
            key: "assemblies-root",
            title: "📦 اسمبلی‌ها",
            children: assemblies,
          },
          {
            key: "components-root",
            title: "🔩 قطعات",
            children: components,
          },
        ];

        setTreeData(root);
      } catch (err) {
        console.error("Error loading tree:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchTree();
  }, [warehouseId]);

  if (loading) return <div className="p-4 text-gray-500">در حال بارگذاری ...</div>;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 font-bold text-lg text-gray-800">درخت محصولات</h2>
      <Tree treeData={treeData} defaultExpandAll />
    </div>
  );
}
