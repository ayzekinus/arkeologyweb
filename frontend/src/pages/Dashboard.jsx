import React, { useEffect, useState } from "react";
import { apiGet } from "../api.js";
import AlertModal from "../components/AlertModal.jsx";
import useAlertModal from "../hooks/useAlertModal.js";
import { Card, CardHeader, CardBody, CardTitle } from "../ui/Card.jsx";

export default function Dashboard() {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState("");
  const { alert, showAlert, hideAlert } = useAlertModal();

  useEffect(() => {
    apiGet("/api/health/")
      .then(setHealth)
      .catch((e) => {
        setError(e.message);
        showAlert({ type: "error", message: e.message || "Servis durumu alınamadı." });
      });
  }, [showAlert]);

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
            <div className="text-sm text-slate-600">Servis durumu alınamadı.</div>
          ) : !health ? (
            <div className="text-sm text-slate-600">Yükleniyor...</div>
          ) : (
            <pre className="overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
              {JSON.stringify(health, null, 2)}
            </pre>
          )}
        </CardBody>
      </Card>

      <AlertModal open={alert.open} type={alert.type} title={alert.title} message={alert.message} onClose={hideAlert} />
    </div>
  );
}
