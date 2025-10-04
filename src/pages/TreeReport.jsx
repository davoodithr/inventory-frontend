import React, { useEffect, useState } from "react";
import Tree from "react-d3-tree";
import { fromJalaliStr } from "../utils/jalali";

// Helper to assign colors based on node depth
const getNodeStyle = (depth) => {
  switch (depth) {
    case 0: // Root
      return {
        circle: { stroke: "#a7b9d1", strokeWidth: 1 },
        name: { fill: "#FFFFFF", fontSize: "17px", fontWeight: "100" },
      };
    case 1: // Source warehouses
      return {
        circle: { fill: "#b5e0ff", stroke: "#b5e0ff", strokeWidth: 1 },
        name: { fontSize: "15px", fontWeight: "100" },
      };
    case 2: // Products
      return {
        circle: { fill: "#10B981", stroke: "#047857", strokeWidth: 2 },
        name: { fontSize: "15px", fontWeight: "100" },
      };
    case 3: // Destination warehouses
      return {
        circle: { fill: "#8B5CF6", stroke: "#5B21B6", strokeWidth: 2 },
        name: { fontSize: "15px", fontWeight: "100" },
      };
    default:
      return {
        circle: { fill: "#D1D5DB", stroke: "#9CA3AF", strokeWidth: 2 },
        name: { fontSize: "15px", fontWeight: "100" },
      };
  }
};

const prepareTreeData = (transactions, filters) => {
  console.log("Input transactions to Tree:", transactions); // Debug: Log input transactions

  // Filter for move transactions
  let list = transactions.filter((t) => t.trx_type === "move");

  // Apply filters
  if (filters.usage !== "all") {
    list = list.filter((t) => t.usage_type === filters.usage);
  }
  if (filters.dateFromJ) {
    const fromDate = fromJalaliStr(filters.dateFromJ);
    if (fromDate) {
      const fromTs = fromDate.getTime();
      list = list.filter((t) => new Date(t.created_at).getTime() >= fromTs);
    }
  }
  if (filters.dateToJ) {
    const toDate = fromJalaliStr(filters.dateToJ);
    if (toDate) {
      toDate.setHours(23, 59, 59, 999);
      const toTs = toDate.getTime();
      list = list.filter((t) => new Date(t.created_at).getTime() <= toTs);
    }
  }
  if (filters.q.trim()) {
    const needle = filters.q.trim().toLowerCase();
    list = list.filter((t) => {
      const fromName = String(t.from_wh?.name || "").toLowerCase();
      const toName = String(t.to_wh?.name || "").toLowerCase();
      const productName = String(t.product?.name || "").toLowerCase();
      const ref = String(t.ref || "").toLowerCase();
      return (
        fromName.includes(needle) ||
        toName.includes(needle) ||
        productName.includes(needle) ||
        ref.includes(needle)
      );
    });
  }

  console.log("Filtered move transactions for Tree:", list); // Debug: Log filtered transactions

  // Build tree structure
  const treeData = {
    name: "انبارها",
    children: [],
  };

  // Group by source warehouse
  const sourceGroups = list.reduce((acc, t) => {
    if (!t.from_wh?.id || !t.to_wh?.id || !t.qty || !t.product?.name) return acc;
    const sourceId = t.from_wh.id;
    const sourceName = t.from_wh.name || `انبار ${t.from_wh.id}`;
    const productName = t.product.name;
    const targetId = t.to_wh.id;
    const targetName = t.to_wh.name || `انبار ${t.to_wh.id}`;
    const qty = Number(t.qty) || 0;

    if (!acc[sourceId]) {
      acc[sourceId] = {
        name: sourceName,
        children: {},
      };
    }

    // Group by product within source warehouse
    const productKey = `${sourceId}-${productName}`;
    if (!acc[sourceId].children[productKey]) {
      acc[sourceId].children[productKey] = {
        name: productName,
        children: [],
      };
    }

    // Add destination with quantity
    acc[sourceId].children[productKey].children.push({
      name: `${targetName}: ${qty}`,
    });

    return acc;
  }, {});

  // Convert to tree format
  Object.values(sourceGroups).forEach((source) => {
    const sourceNode = {
      name: source.name,
      children: Object.values(source.children),
    };
    treeData.children.push(sourceNode);
  });

  console.log("Tree data:", treeData); // Debug: Log tree data

  return treeData;
};

const TreeReport = ({ transactions, filters }) => {
  const [treeData, setTreeData] = useState(null);

  useEffect(() => {
    const data = prepareTreeData(transactions, filters);
    setTreeData(data);
  }, [transactions, filters]);

  if (!treeData || !treeData.children.length) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
        <p className="text-sm text-gray-600">هیچ انتقالی برای نمایش وجود ندارد.</p>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl border border-gray-200 bg-white p-6"
      style={{ height: "600px", position: "relative" }}
    >
      <style>
        {`
          .rd3t-node:hover circle {
            filter: drop-shadow(0 0 5px rgba(0, 0, 0, 0.3));
            transform: scale(1.1);
            transition: all 0.2s ease;
          }
          .rd3t-node text {            
            font-weight: 100;
          }
          .rd3t-link {
            stroke-opacity: 0.6;
            transition: stroke-opacity 0.2s ease;
          }
          .rd3t-link:hover {
            stroke-opacity: .6;
          }
        `}
      </style>
      <Tree
        data={treeData}
        // horizontal "vertical"
        orientation="horizontal"
        translate={{ x: 400, y: 50 }} // Center the tree
        nodeSize={{ x: 220, y: 120 }}
        pathFunc="diagonal"
        renderCustomNodeElement={({ nodeDatum, toggleNode }) => (
          <g>
            <circle
              r="15"
              style={{
                ...getNodeStyle(nodeDatum.__rd3t.depth).circle,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onClick={toggleNode}
            />
            <text
              x="20"
              y="5"
              style={{
                ...getNodeStyle(nodeDatum.__rd3t.depth).name,
                // fontFamily: "Vazirmatn, sans-serif",
                fontWeight: "100", // Explicitly set to normal weight
              }}
            >
              {nodeDatum.name}
            </text>
          </g>
        )}
        styles={{
          links: {
            stroke: "url(#linkGradient)",
            strokeWidth: 2,
          },
        }}
      />
      <svg width="0" height="0">
        <defs>
          <linearGradient id="linkGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: "#3B82F6", stopOpacity: 0.8 }} />
            <stop offset="100%" style={{ stopColor: "#8B5CF6", stopOpacity: 0.8 }} />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

export default TreeReport;