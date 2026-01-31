import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiDelete, apiGet } from "../api.js";
import ConservationDetailModal from "../components/ConservationDetailModal.jsx";
import { IconCsv, IconDelete, IconEdit, IconPdf, IconView, IconXls } from "../ui/Icons.jsx";
import { Card, CardHeader, CardBody, CardTitle } from "../ui/Card.jsx";
import Button from "../ui/Button.jsx";
import Pagination from "../ui/Pagination.jsx";

export default function ConservationList() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRow, setDetailRow] = useState(null);

  async function load(nextPage = page) {
    setErr("");
    setMsg("");
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

  function openDetail(row) {
    setDetailRow(row);
    setDetailOpen(true);
  }

  async function onDelete(id) {
    if (!confirm("Silmek istediğinize emin misiniz?")) return;
    setMsg("");
    setErr("");
    try {
      await apiDelete(`/api/conservations/${id}/`);
      setMsg("Kayıt silindi.");
      await load(page);
    } catch (e) {
      setErr(e.message || "Silme başarısız.");
    }
  }

  function download(url) {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function onExport(id, format, filenameBase) {
    if (!id) {
      setErr("Export için kayıt id bulunamadı.");
      return;
    }
    const url = `/api/conservations/${id}/export/?format=${encodeURIComponent(format)}`;
    download(url);
    setMsg(`Export başlatıldı: ${(filenameBase || "conservation")}.${format}`);
  }

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
      {msg ? <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{msg}</div> : null}

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle>Konservasyon Kayıtları</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="rounded-md border border-slate-200 px-2 py-1 text-sm"
              value={String(pageSize)}
              onChange={(e) => {
                setPageSize(parseInt(e.target.value, 10));
                setPage(1);
              }}
            >
              {[10, 20, 50].map((n) => (
                <option key={n} value={n}>
                  {n} / sayfa
                </option>
              ))}
            </select>
            <Button variant="secondary" onClick={() => load(1).then(() => setPage(1))}>
              Yenile
            </Button>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          {rows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
              Henüz konservasyon kaydı bulunmuyor.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-xs text-slate-500">
                    {["Buluntu No", "Malzeme", "Konservatör", "Tarih", "Detay", "Export"].map((h) => (
                      <th key={h} className="border-b border-slate-200 px-2 py-2">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50">
                      <td className="border-b border-slate-100 px-2 py-2 font-semibold">
                        {row.artifact_full_no || `Kayıt #${row.id}`}
                      </td>
                      <td className="border-b border-slate-100 px-2 py-2">{row.material || ""}</td>
                      <td className="border-b border-slate-100 px-2 py-2">{row.conservator || ""}</td>
                      <td className="border-b border-slate-100 px-2 py-2">
                        {row.created_at ? new Date(row.created_at).toLocaleDateString("tr-TR") : ""}
                      </td>
                      <td className="border-b border-slate-100 px-2 py-2">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="secondary"
                            className="py-1.5"
                            onClick={() => openDetail(row)}
                            aria-label="Görüntüle"
                            title="Görüntüle"
                          >
                            <IconView />
                          </Button>
                          <Button
                            variant="secondary"
                            className="py-1.5"
                            onClick={() => navigate(`/konservasyon/duzenle/${row.id}`)}
                            aria-label="Düzenle"
                            title="Düzenle"
                          >
                            <IconEdit />
                          </Button>
                          <Button
                            variant="danger"
                            className="py-1.5"
                            onClick={() => onDelete(row.id)}
                            aria-label="Sil"
                            title="Sil"
                          >
                            <IconDelete />
                          </Button>
                        </div>
                      </td>
                      <td className="border-b border-slate-100 px-2 py-2">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="secondary"
                            className="py-1.5"
                            onClick={() => onExport(row.id, "pdf", row.artifact_full_no)}
                            aria-label="PDF"
                            title="PDF"
                          >
                            <IconPdf />
                          </Button>
                          <Button
                            variant="secondary"
                            className="py-1.5"
                            onClick={() => onExport(row.id, "xlsx", row.artifact_full_no)}
                            aria-label="XLS"
                            title="XLS"
                          >
                            <IconXls />
                          </Button>
                          <Button
                            variant="secondary"
                            className="py-1.5"
                            onClick={() => onExport(row.id, "csv", row.artifact_full_no)}
                            aria-label="CSV"
                            title="CSV"
                          >
                            <IconCsv />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Pagination page={page} pageSize={pageSize} count={count} onPageChange={(p) => setPage(Math.max(1, p))} />
        </CardBody>
      </Card>

      <ConservationDetailModal
        open={detailOpen}
        conservation={detailRow}
        onClose={() => {
          setDetailOpen(false);
          setDetailRow(null);
        }}
      />
    </div>
  );
}
