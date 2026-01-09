import React from "react";

const styles = {
  primary: "bg-slate-900 text-white hover:bg-slate-800 border border-slate-900",
  secondary: "bg-white text-slate-900 hover:bg-slate-50 border border-slate-200",
  danger: "bg-white text-rose-600 hover:bg-rose-50 border border-rose-200",
  ghost: "bg-transparent text-slate-700 hover:bg-slate-100 border border-transparent",
};

export default function Button({ variant = "secondary", className = "", ...props }) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-50 disabled:cursor-not-allowed";
  return <button className={`${base} ${styles[variant] || styles.secondary} ${className}`} {...props} />;
}
