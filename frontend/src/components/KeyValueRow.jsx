import React from "react";

export default function KeyValueRow({ label, value }) {
  if (value === null || value === undefined || value === "") return null;

  return (
    <div className="grid grid-cols-[220px_1fr] gap-3 border-b border-slate-100 py-2">
      <div className="text-sm font-semibold text-slate-600">{label}</div>
      <div className="text-sm whitespace-pre-wrap">{value}</div>
    </div>
  );
}
