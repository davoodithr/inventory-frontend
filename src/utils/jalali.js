// src/utils/jalali.js
import jalaali from "jalaali-js";

const pad2 = (n) => String(n).padStart(2, "0");

// Convert ISO date → Jalali formatted string: "1403/06/24 12:30"
export function toJalaliDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  const { jy, jm, jd } = jalaali.toJalaali(d);
  const hh = pad2(d.getHours());
  const mm = pad2(d.getMinutes());
  return `${jy}/${pad2(jm)}/${pad2(jd)} ${hh}:${mm}`;
}

// Parse Jalali string "1403/06/24" → JS Date (midnight) or null
export function fromJalaliStr(s) {
  if (!s) return null;
  const m = s.trim().match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (!m) return null;
  const jy = +m[1], jm = +m[2], jd = +m[3];
  if (jm < 1 || jm > 12 || jd < 1 || jd > 31) return null;
  const { gy, gm, gd } = jalaali.toGregorian(jy, jm, jd);
  const g = new Date(gy, gm - 1, gd, 0, 0, 0, 0);
  return isNaN(g.getTime()) ? null : g;
}
