import React from "react";

export function Card({ className = "", ...props }) {
  return <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`} {...props} />;
}

export function CardHeader({ className = "", ...props }) {
  return <div className={`px-4 py-3 border-b border-slate-200 ${className}`} {...props} />;
}

export function CardBody({ className = "", ...props }) {
  return <div className={`p-4 ${className}`} {...props} />;
}

export function CardTitle({ className = "", ...props }) {
  return <div className={`font-extrabold text-slate-900 ${className}`} {...props} />;
}
