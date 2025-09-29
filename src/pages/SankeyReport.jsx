// src/pages/SankeyReport.jsx
import React, { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import { fromJalaliStr } from "../utils/jalali";

const prepareSankeyData = (transactions, filters) => {
  console.log("Input transactions to Sankey:", transactions); // Debug: Log input transactions

  // Filter for move transactions with product name "MFD"
  let list = transactions.filter((t) => t.trx_type === "move" && t.product?.name === "MFD");

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

  console.log("Filtered MFD move transactions:", list); // Debug: Log filtered transactions

  // Aggregate quantities by (from_wh, to_wh) pair for MFD
  const flows = list.reduce((acc, t) => {
    if (!t.from_wh?.id || !t.to_wh?.id || !t.qty || !t.product?.name) return acc; // Skip invalid data
    const key = `${t.from_wh.id}->${t.to_wh.id}`;
    const qty = Number(t.qty) || 0;
    if (!acc[key]) {
      acc[key] = {
        source: t.from_wh.id,
        sourceName: t.from_wh.name || `انبار ${t.from_wh.id}`,
        target: t.to_wh.id,
        targetName: t.to_wh.name || `انبار ${t.to_wh.id}`,
        productName: t.product.name,
        value: 0,
      };
    }
    acc[key].value += qty;
    return acc;
  }, {});

  // Extract unique nodes
  const nodesMap = new Map();
  Object.values(flows).forEach((flow) => {
    nodesMap.set(flow.source, { id: flow.source, name: flow.sourceName });
    nodesMap.set(flow.target, { id: flow.target, name: flow.targetName });
  });

  // Convert to Sankey format
  const nodes = Array.from(nodesMap.values());
  const links = Object.values(flows).map((flow) => ({
    source: nodes.findIndex((n) => n.id === flow.source),
    target: nodes.findIndex((n) => n.id === flow.target),
    value: flow.value,
    label: `${flow.productName}: ${flow.value}`, // Format: "MFD: quantity"
  }));

  console.log("Sankey nodes:", nodes, "Sankey links:", links); // Debug: Log Sankey data

  return { nodes, links };
};

const SankeyReport = ({ transactions, filters }) => {
  const [sankeyData, setSankeyData] = useState(null);

  useEffect(() => {
    const data = prepareSankeyData(transactions, filters);
    setSankeyData(data);
  }, [transactions, filters]);

  if (!sankeyData || !sankeyData.nodes.length || !sankeyData.links.length) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
        <p className="text-sm text-gray-600">هیچ انتقالی برای محصول MFD وجود ندارد.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <Plot
        data={[
          {
            type: "sankey",
            orientation: "h",
            node: {
              pad: 15,
              thickness: 30,
              line: { color: "black", width: 0.5 },
              label: sankeyData.nodes.map((n) => n.name),
              color: sankeyData.nodes.map(() => "#4B5EAA"), // Blue for nodes
            },
            link: {
              source: sankeyData.links.map((l) => l.source),
              target: sankeyData.links.map((l) => l.target),
              value: sankeyData.links.map((l) => l.value),
              label: sankeyData.links.map((l) => l.label), // Use custom labels
              color: sankeyData.links.map(() => "rgba(75, 94, 170, 0.4)"), // Semi-transparent blue
            },
          },
        ]}
        layout={{
          title: "گزارش انتقال محصول MFD بین انبارها",
          font: { size: 12, family: "Vazirmatn, sans-serif" },
          width: 800,
          height: 600,
          paper_bgcolor: "rgba(0,0,0,0)",
          plot_bgcolor: "rgba(0,0,0,0)",
        }}
        config={{ responsive: true, displayModeBar: false }}
      />
    </div>
  );
};

export default SankeyReport;