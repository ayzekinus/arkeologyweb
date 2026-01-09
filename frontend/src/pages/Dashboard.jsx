import React, { useEffect, useState } from "react";
import { apiGet } from "../api.js";
import { Card, CardHeader, CardBody, CardTitle } from "../ui/Card.jsx";

export default function Dashboard() {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiGet("/api/health/")
      .then(setHealth)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">
          Bu ekran monorepo iskeletinin çalıştığını doğrular.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API Health</CardTitle>
        </CardHeader>
        <CardBody>
          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          ) : !health ? (
            <div className="text-sm text-slate-600">Yükleniyor...</div>
          ) : (
            <pre className="overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
              {JSON.stringify(health, null, 2)}
            </pre>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
