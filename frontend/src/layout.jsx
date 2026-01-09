import React from "react";
import { NavLink, Outlet } from "react-router-dom";

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "block rounded-xl px-3 py-2 text-sm font-semibold transition",
          isActive ? "bg-slate-200 text-slate-900" : "text-slate-700 hover:bg-slate-100",
        ].join(" ")
      }
    >
      {children}
    </NavLink>
  );
}

function NavGroup({ title, children }) {
  return (
    <div>
      <div className="px-2 text-xs font-extrabold uppercase tracking-wide text-slate-500">
        {title}
      </div>
      <div className="mt-2 grid gap-2">{children}</div>
    </div>
  );
}

export default function Layout() {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-[260px_1fr]">
      <aside className="border-b border-slate-200 bg-white p-4 md:border-b-0 md:border-r">
        <div className="text-lg font-extrabold">Arkeoloji Panel</div>
        <div className="mt-1 text-xs text-slate-500">Django + React (Tailwind)</div>

        <nav className="mt-4 grid gap-4">
          <NavItem to="/">Dashboard</NavItem>

          <NavGroup title="Anakod">
            <NavItem to="/anakod/olustur">Oluştur</NavItem>
            <NavItem to="/anakod/listele">Listele</NavItem>
          </NavGroup>

          <NavGroup title="Buluntu">
            <NavItem to="/buluntu/olustur">Oluştur</NavItem>
            <NavItem to="/buluntu/listele">Listele</NavItem>
          </NavGroup>
        </nav>
      </aside>

      <main className="p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
}
