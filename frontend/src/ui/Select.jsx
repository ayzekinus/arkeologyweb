import React from "react";

export default function Select({ className = "", children, ...props }) {
  return (
    <select
      className={`w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}
