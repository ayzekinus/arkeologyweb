import React, { useEffect, useState } from "react";

export default function App() {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    fetch("/api/health/")
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setHealth({ status: "error" }));
  }, []);

  return (
    <div style={{ fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial", padding: 24 }}>
      <h1>Arkeoloji Panel (Django + React)</h1>
      <p>Bu ekran Docker monorepo iskeletinin çalıştığını doğrular.</p>

      <div style={{ marginTop: 16, padding: 12, border: "1px solid #ddd", borderRadius: 10 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>API Health</div>
        <pre style={{ margin: 0 }}>{JSON.stringify(health, null, 2)}</pre>
      </div>

      <div style={{ marginTop: 16 }}>
        <a href="/admin/" target="_blank" rel="noreferrer">Django Admin</a>
      </div>
    </div>
  );
}
