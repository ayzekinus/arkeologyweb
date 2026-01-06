import React, { useEffect, useState } from "react";
import { apiGet } from "../api.js";

export default function Dashboard() {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiGet("/api/health/")
      .then(setHealth)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Dashboard</h1>
      <p>Bu ekran monorepo iskeletinin çalıştığını doğrular.</p>

      <div style={{ marginTop: 16, padding: 12, border: "1px solid #ddd", borderRadius: 12 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>API Health</div>
        {error ? <div style={{ color: "#b00" }}>{error}</div> : <pre style={{ margin: 0 }}>{JSON.stringify(health, null, 2)}</pre>}
      </div>
    </div>
  );
}
