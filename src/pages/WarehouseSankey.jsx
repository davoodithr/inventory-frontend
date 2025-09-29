// src/components/TransactionSankey.jsx
import React, { useMemo, useRef, useState, useEffect } from "react";
import { ResponsiveContainer, Sankey, Tooltip } from "recharts";

const EPS = 1e-9;

const sanitizedLinks = links.map((l) => ({
  source: Number.isFinite(l.source) ? l.source : 0,
  target: Number.isFinite(l.target) ? l.target : 0,
  value: Number.isFinite(l.value) ? l.value : 0,
  trx_types: l.trx_types || [],
}));

const sanitizedNodes = nodes.map((n) => ({
  name: n.name || "unknown", // fallback if name is missing
}));


function parseQty(q) {
  if (q == null) return NaN;
  const s = String(q).trim();
  if (s === "") return NaN;
  if (s.indexOf(",") !== -1 && s.indexOf(".") !== -1) return parseFloat(s.replace(/,/g, ""));
  if (s.indexOf(",") !== -1 && s.indexOf(".") === -1) return parseFloat(s.replace(/,/g, "."));
  return parseFloat(s);
}

/** validateNodesLinks
 * returns { ok: bool, reason: string|null, checks: {} }
 */
function validateNodesLinks(nodes, links) {
  const checks = {};
  if (!Array.isArray(nodes) || !Array.isArray(links)) {
    return { ok: false, reason: "nodes or links is not array", checks };
  }

  checks.nodeCount = nodes.length;
  checks.linkCount = links.length;

  // check nodes have 'name' and are objects
  const badNodes = nodes.map((n, i) => ({ i, ok: n && typeof n.name === "string" }));
  checks.badNodes = badNodes.filter((b) => !b.ok).map((b) => b.i);
  if (checks.badNodes.length) return { ok: false, reason: "some nodes missing name", checks };

  // check links fields and numeric types
  let maxIdx = -1;
  const badLinks = [];
  for (let i = 0; i < links.length; ++i) {
    const l = links[i];
    if (!l || typeof l !== "object") { badLinks.push({ i, reason: "not object" }); continue; }
    if (!Number.isFinite(l.source)) { badLinks.push({ i, reason: "source not finite" }); continue; }
    if (!Number.isFinite(l.target)) { badLinks.push({ i, reason: "target not finite" }); continue; }
    if (!Number.isFinite(l.value)) { badLinks.push({ i, reason: "value not finite" }); continue; }
    if (l.value <= 0) { badLinks.push({ i, reason: "value <= 0" }); continue; }
    if (!Number.isInteger(l.source) || !Number.isInteger(l.target)) {
      // Recharts accepts numbers, but indices should be integers
      badLinks.push({ i, reason: "source/target not integer" }); continue;
    }
    maxIdx = Math.max(maxIdx, l.source, l.target);
  }
  checks.badLinks = badLinks;
  checks.maxLinkIndex = maxIdx;

  if (badLinks.length) return { ok: false, reason: "bad link entries", checks };
  if (maxIdx >= nodes.length) return { ok: false, reason: "link index out of range", checks };

  // optional: check sum of values > 0
  const total = links.reduce((s, l) => s + Number(l.value || 0), 0);
  checks.total = total;
  if (!Number.isFinite(total) || total <= 0) return { ok: false, reason: "total link value non-positive", checks };

  return { ok: true, reason: null, checks };
}

// Known-good sample used as fallback so you can verify recharts works
const SAMPLE = {
  nodes: [{ name: "Warehouse A" }, { name: "Warehouse B" }, { name: "Production" }],
  links: [
    { source: 0, target: 2, value: 30 },
    { source: 2, target: 1, value: 25 },
  ],
};

export default function TransactionSankey({ transactions = [] }) {
  const containerRef = useRef(null);
  const [sizeReady, setSizeReady] = useState(false);

  // wait until parent container has positive size
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const check = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      setSizeReady(Boolean(w > 0 && h > 0));
    };
    check();
    let ro;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => check());
      ro.observe(el);
    } else {
      const onResize = () => check();
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }
    return () => ro && ro.disconnect();
  }, []);

  // build nodes & links from transactions
  const { nodes, links, meta } = useMemo(() => {
    const nodeIndex = new Map();
    const addNode = (key) => {
      if (!nodeIndex.has(key)) nodeIndex.set(key, nodeIndex.size);
      return nodeIndex.get(key);
    };
    const agg = new Map();

    for (const t of transactions || []) {
      const fromId = t?.from_wh?.id ?? "in_ext";
      const toId = t?.to_wh?.id ?? "out_ext";
      const fromName = t?.from_wh?.name ?? "external_in";
      const toName = t?.to_wh?.name ?? "external_out";
      const srcKey = `${fromName}__${fromId}`;
      const dstKey = `${toName}__${toId}`;
      const raw = parseQty(t?.qty);
      if (!Number.isFinite(raw)) continue;
      const value = Number(raw);
      if (!Number.isFinite(value) || value === 0) continue;
      addNode(srcKey);
      addNode(dstKey);
      const k = `${srcKey}||${dstKey}`;
      const prev = agg.get(k) || { value: 0, types: new Set() };
      prev.value += value;
      if (t?.trx_type) prev.types.add(t.trx_type);
      agg.set(k, prev);
    }

    const nodeList = Array.from(nodeIndex.keys()).map((key) => ({ name: String(key).replace(/__\d+$/, "") }));
    const linkList = [];
    for (const [k, v] of agg.entries()) {
      const [srcKey, dstKey] = k.split("||");
      const sIdx = nodeIndex.get(srcKey);
      const tIdx = nodeIndex.get(dstKey);
      const val = Number(v.value);
      if (!Number.isFinite(sIdx) || !Number.isFinite(tIdx) || !Number.isFinite(val)) continue;
      const safeVal = Math.abs(val) < EPS ? EPS : val;
      // ensure integer indices
      linkList.push({ source: Math.floor(sIdx), target: Math.floor(tIdx), value: safeVal, trx_types: Array.from(v.types || []) });
    }

    const meta = { nodeIndexSize: nodeIndex.size, rawAggCount: agg.size };
    return { nodes: nodeList, links: linkList, meta };
  }, [transactions]);

  // If no size yet, show placeholder so container gets measured
  if (!sizeReady) {
    return (
      <div ref={containerRef} className="w-full h-96 p-4 bg-white rounded-xl shadow-sm flex items-center justify-center">
        <div className="text-sm text-gray-500">در حال آماده‌سازی نمودار...</div>
      </div>
    );
  }

  // Validate
  const validation = useMemo(() => validateNodesLinks(nodes, links), [nodes, links]);

  if (!validation.ok) {
    // Print clean debug log — copy/paste this into the chat if you still need help
    console.warn("TransactionSankey validation failed:", validation.reason, validation.checks);
    console.info("Nodes sample:", nodes.slice(0, 20));
    console.info("Links sample:", links.slice(0, 50));
    console.info("Meta:", meta);
    // Render fallback test Sankey (so we can confirm the library renders)
    return (
      <div ref={containerRef} className="w-full h-96 p-4 bg-white rounded-xl shadow-sm">
        <div className="mb-3 text-sm text-gray-600">داده‌های جاری نامعتبر است — نمایش نمونهٔ آزمایشی</div>

    <ResponsiveContainer width="100%" height="100%">
      <Sankey
        data={{ nodes: sanitizedNodes, links: sanitizedLinks }}
        nodePadding={10}
        nodeWidth={16}
      >
        <Tooltip />
      </Sankey>
    </ResponsiveContainer>

        <div className="mt-3 text-xs text-gray-500">
          نگاه به کنسول برای دیباگ (nodes/links/validation).
        </div>
      </div>
    );
  }

  // final safety: before send to recharts double-check ranges
  const maxIndex = links.reduce((m, l) => Math.max(m, l.source, l.target), -1);
  if (maxIndex >= nodes.length) {
    console.error("TransactionSankey: index out of range (maxIndex >= nodes.length)", { maxIndex, nodesLen: nodes.length, links });
    // fallback to sample to avoid NaN
    return (
      <div ref={containerRef} className="w-full h-96 p-4 bg-white rounded-xl shadow-sm">
        <div className="mb-3 text-sm text-red-600">خطای داخلی در داده‌های نمودار — نمونه آزمایشی نمایش داده می‌شود.</div>

    <ResponsiveContainer width="100%" height="100%">
      <Sankey
        data={{ nodes: sanitizedNodes, links: sanitizedLinks }}
        nodePadding={10}
        nodeWidth={16}
      >
        <Tooltip />
      </Sankey>
    </ResponsiveContainer>

      </div>
    );
  }

  // All good — render
  return (
    <div ref={containerRef} className="w-full h-96 p-4 bg-white rounded-xl shadow-sm">
    <ResponsiveContainer width="100%" height="100%">
      <Sankey
        data={{ nodes: sanitizedNodes, links: sanitizedLinks }}
        nodePadding={10}
        nodeWidth={16}
      >
        <Tooltip />
      </Sankey>
    </ResponsiveContainer>


    </div>
  );
}
