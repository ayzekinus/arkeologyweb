import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet } from "../api.js";
import { Card, CardHeader, CardBody, CardTitle } from "../ui/Card.jsx";
import Button from "../ui/Button.jsx";
import Pagination from "../ui/Pagination.jsx";

export default function ConservationList() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);
  const [err, setErr] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  async function load(nextPage = page) {
    setErr("");
    const params = new URLSearchParams();
    params.set("ordering", "-created_at");
    params.set("page", String(nextPage));
    params.set("page_size", String(pageSize));
    const data = await apiGet(`/api/conservations/?${params.toString()}`);
    const results = data.results || data;
    setRows(results || []);
    setCount(data.count ?? (Array.isArray(results) ? results.length : 0));
  }

  useEffect(() => {
    load(1).then(() => setPage(1)).catch((e) => setErr(e.message || "Liste yüklenemedi."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load(page).catch((e) => setErr(e.message || "Liste yüklenemedi."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Konservasyon Listele</h1>
          <p className="mt-1 text-sm text-slate-600">Konservasyon kayıtlarını görüntüleyin.</p>
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" type="button" onClick={() => navigate("/konservasyon/olustur")}>
            Yeni Kayıt
          </Button>
        </div>
      </div>

      {err ? <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{err}</div> : null}

      <Card>
        <CardHeader>
          <CardTitle>Konservasyon Kayıtları</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          {rows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
              Henüz konservasyon kaydı bulunmuyor.
            </div>
          ) : (
            <div className="grid gap-2">
              {rows.map((row) => (
                <div
                  key={row.id}
                  className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      {row.artifact_full_no || `Kayıt #${row.id}`}
                    </div>
                    <div className="text-xs text-slate-500">
                      Malzeme: {row.material || "Belirtilmemiş"} · Konservatör: {row.conservator || "Belirtilmemiş"}
                    </div>
                  </div>
                  <div className="text-xs text-slate-400">
                    {row.created_at ? new Date(row.created_at).toLocaleDateString("tr-TR") : ""}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs text-slate-500">Toplam: {count}</div>
            <Pagination
              page={page}
              setPage={setPage}
              pageSize={pageSize}
              setPageSize={setPageSize}
              total={count}
            />
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
