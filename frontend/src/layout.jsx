import React from "react";
import { Link, NavLink, Outlet } from "react-router-dom";

const navLinkStyle = ({ isActive }) => ({
  display: "block",
  padding: "10px 12px",
  borderRadius: 10,
  textDecoration: "none",
  color: isActive ? "#000" : "#333",
  background: isActive ? "#eee" : "transparent",
  fontWeight: isActive ? 700 : 500,
});

export default function Layout() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", minHeight: "100vh", fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial" }}>
      <aside style={{ padding: 18, borderRight: "1px solid #e5e5e5" }}>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>Arkeoloji Panel</div>
        <div style={{ color: "#666", fontSize: 13, marginBottom: 16 }}>
          Django + DRF + React (Docker)
        </div>

        <nav style={{ display: "grid", gap: 6 }}>
          <NavLink to="/" style={navLinkStyle} end>Dashboard</NavLink>
          <NavLink to="/anakod" style={navLinkStyle}>Anakod</NavLink>
          <NavLink to="/buluntu" style={navLinkStyle}>Buluntu</NavLink>
          <a href="/admin/" style={{ ...navLinkStyle({ isActive: false }), border: "1px solid #eee" }} target="_blank" rel="noreferrer">
            Django Admin
          </a>
        </nav>

        <div style={{ marginTop: 18, fontSize: 12, color: "#777" }}>
          API: <code>/api/</code>
        </div>
      </aside>

      <main style={{ padding: 24 }}>
        <Outlet />
      </main>
    </div>
  );
}
