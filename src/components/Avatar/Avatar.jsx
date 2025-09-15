/* ---------------- اجزای UI کوچک ---------------- */
export default  function Avatar({ first, last, username }) {
  const initials =
    ((first?.[0] || username?.[0] || "?") + (last?.[0] || "")).toUpperCase();
  return (
    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold">
      {initials.slice(0, 2)}
    </div>
  );
}
