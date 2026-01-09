import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet, apiDelete } from "../api.js";
import ArtifactDetailModal from "../components/ArtifactDetailModal.jsx";

import { Card, CardHeader, CardBody, CardTitle } from "../ui/Card.jsx";
import Button from "../ui/Button.jsx";
import Input from "../ui/Input.jsx";
import Select from "../ui/Select.jsx";
import Pagination from "../ui/Pagination.jsx";

function buildQuery(params) {
  const qs = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v === null || v === undefined) return;
    const s = String(v).trim();
    if (!s) return;
    qs.set(k, s);
  });
  return qs.toString();
}

function download(url) {
  // Force download via navigation (works well with nginx reverse proxy)
  window.location.href = url;
}

export default function BuluntuList() {
  const navigate = useNavigate();

  function onExport(id, format, filenameBase) {
  setMsg("");
  setErr("");
  if (!id) {
    setErr("Export için kayıt id bulunamadı.");
    return;
  }
  const url = `/api/artifacts/${id}/export/?format=${encodeURIComponent(format)}`;
  download(url);
  setMsg(`Export başlatıldı: ${(filenameBase || "artifact")}.${format === "xlsx" ? "xlsx" : format}`);
}

  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRow, setDetailRow] = useState(null);

  // List controls
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [ordering, setOrdering] = useState("-created_at");

  const [filters, setFilters] = useState({
    q: "",
    main_code_code: "",
    finding_place: "",
    artifact_no: "",
    production_material: "",
    period: "",
    form_type: "",
    date_from: "",
    date_to: "",
  });

  const [filterDraft, setFilterDraft] = useState({ ...filters });

  async function load(nextPage = page) {
    setErr("");
    const q = buildQuery({
      ...filters,
      ordering,
      page: nextPage,
      page_size: pageSize,
    });

    const data = await apiGet(`/api/artifacts/?${q}`);
    const r = data.results || data;
    setRows(r || []);
    setCount(data.count ?? (Array.isArray(r) ? r.length : 0));
  }

  useEffect(() => {
    load(1).then(() => setPage(1)).catch((e) => setErr(e.message || "Liste yüklenemedi."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load(page).catch((e) => setErr(e.message || "Liste yüklenemedi."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, ordering, filters]);

  function applyFilters() {
    setFilters({ ...filterDraft });
    setPage(1);
  }

  function clearFilters() {
    const empty = {
      q: "",
      main_code_code: "",
      finding_place: "",
      artifact_no: "",
      production_material: "",
      period: "",
      form_type: "",
      date_from: "",
      date_to: "",
    };
    setFilterDraft(empty);
    setFilters(empty);
    setPage(1);
  }

  function openDetail(row) {
    setDetailRow(row);
    setDetailOpen(true);
  }

  async function onDelete(id) {
    if (!confirm("Silmek istediğinize emin misiniz?")) return;
    setMsg("");
    setErr("");
    try {
      await apiDelete(`/api/artifacts/${id}/`);
      setMsg("Kayıt silindi.");
      await load(page);
    } catch (e) {
      setErr(e.message || "Silme başarısız.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Buluntu Listele</h1>
          <p className="mt-1 text-sm text-slate-600">Server-side filtreleme ve sayfalama.</p>
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" type="button" onClick={() => navigate("/buluntu/olustur")}>
            Yeni Buluntu
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle>Buluntu Listesi</CardTitle>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={ordering} onChange={(e) => setOrdering(e.target.value)}>
              <option value="-created_at">Sıralama: Yeni → Eski</option>
              <option value="created_at">Sıralama: Eski → Yeni</option>
              <option value="-artifact_date">Buluntu Tarihi: Yeni → Eski</option>
              <option value="artifact_date">Buluntu Tarihi: Eski → Yeni</option>
              <option value="-artifact_no">Buluntu No: Büyük → Küçük</option>
              <option value="artifact_no">Buluntu No: Küçük → Büyük</option>
              <option value="main_code__code">Anakod: A → Z</option>
              <option value="-main_code__code">Anakod: Z → A</option>
            </Select>

            <Select value={String(pageSize)} onChange={(e) => { setPageSize(parseInt(e.target.value, 10)); setPage(1); }}>
              <option value="25">25 / sayfa</option>
              <option value="50">50 / sayfa</option>
              <option value="100">100 / sayfa</option>
              <option value="200">200 / sayfa</option>
            </Select>

            <Button variant="secondary" onClick={() => load(1).then(() => setPage(1))}>
              Yenile
            </Button>
          </div>
        </CardHeader>

        <CardBody className="space-y-3">
          {/* Filters */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Genel Arama</label>
                <div className="mt-1.5">
                  <Input value={filterDraft.q} onChange={(e) => setFilterDraft((p) => ({ ...p, q: e.target.value }))} placeholder="Kod, yer, not, malzeme..." />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Anakod</label>
                <div className="mt-1.5">
                  <Input value={filterDraft.main_code_code} onChange={(e) => setFilterDraft((p) => ({ ...p, main_code_code: e.target.value }))} placeholder="AAA" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Buluntu Yeri</label>
                <div className="mt-1.5">
                  <Input value={filterDraft.finding_place} onChange={(e) => setFilterDraft((p) => ({ ...p, finding_place: e.target.value }))} placeholder="Alan / açma..." />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Buluntu No</label>
                <div className="mt-1.5">
                  <Input value={filterDraft.artifact_no} onChange={(e) => setFilterDraft((p) => ({ ...p, artifact_no: e.target.value }))} placeholder="1" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Yapım Malzemesi</label>
                <div className="mt-1.5">
                  <Input value={filterDraft.production_material} onChange={(e) => setFilterDraft((p) => ({ ...p, production_material: e.target.value }))} placeholder="Seramik, Metal..." />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Dönem</label>
                <div className="mt-1.5">
                  <Input value={filterDraft.period} onChange={(e) => setFilterDraft((p) => ({ ...p, period: e.target.value }))} placeholder="Roma, Bizans..." />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Form</label>
                <div className="mt-1.5">
                  <Select value={filterDraft.form_type} onChange={(e) => setFilterDraft((p) => ({ ...p, form_type: e.target.value }))}>
                    <option value="">Hepsi</option>
                    <option value="GENEL">Genel</option>
                    <option value="SIKKE">Sikke</option>
                    <option value="SERAMIK">Seramik</option>
                    <option value="MEZAR">Mezar</option>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Tarih (Başlangıç)</label>
                <div className="mt-1.5">
                  <Input type="date" value={filterDraft.date_from} onChange={(e) => setFilterDraft((p) => ({ ...p, date_from: e.target.value }))} />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Tarih (Bitiş)</label>
                <div className="mt-1.5">
                  <Input type="date" value={filterDraft.date_to} onChange={(e) => setFilterDraft((p) => ({ ...p, date_to: e.target.value }))} />
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button variant="primary" type="button" onClick={applyFilters}>
                Filtrele
              </Button>
              <Button variant="secondary" type="button" onClick={clearFilters}>
                Temizle
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  {["Tam No", "Anakod", "Buluntu Yeri", "Buluntu No", "Buluntu Tarihi", "Form", "Malzeme", "Dönem", "Detay", "Export"].map((h) => (
                    <th key={h} className="border-b border-slate-200 px-2 py-2">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="border-b border-slate-100 px-2 py-2 font-semibold">{r.full_artifact_no}</td>
                    <td className="border-b border-slate-100 px-2 py-2">{r.main_code_code || r.main_code}</td>
                    <td className="border-b border-slate-100 px-2 py-2">{r.main_code_finding_place || ""}</td>
                    <td className="border-b border-slate-100 px-2 py-2">{String(r.artifact_no).padStart(4, "0")}</td>
                    <td className="border-b border-slate-100 px-2 py-2">{r.artifact_date}</td>
                    <td className="border-b border-slate-100 px-2 py-2">{r.form_type}</td>
                    <td className="border-b border-slate-100 px-2 py-2">{r.production_material || ""}</td>
                    <td className="border-b border-slate-100 px-2 py-2">{r.period || ""}</td>
                    <td className="border-b border-slate-100 px-2 py-2">
                      <div className="flex flex-wrap gap-2">
                        <Button variant="secondary" className="py-1.5" onClick={() => openDetail(r)}>
                          Görüntüle
                        </Button>
                        <Button variant="secondary" className="py-1.5" onClick={() => navigate(`/buluntu/olustur?id=${r.id}`)}>
                          Düzenle
                        </Button>
                        <Button variant="danger" className="py-1.5" onClick={() => onDelete(r.id)}>
                          Sil
                        </Button>
                      </div>
                    </td>
<td className="border-b border-slate-100 px-2 py-2">
  <div className="flex flex-wrap gap-2">
    <Button variant="secondary" className="py-1.5" onClick={() => onExport(r.id, "pdf", r.full_artifact_no)}>
      PDF
    </Button>
    <Button variant="secondary" className="py-1.5" onClick={() => onExport(r.id, "xlsx", r.full_artifact_no)}>
      EXCEL
    </Button>
    <Button variant="secondary" className="py-1.5" onClick={() => onExport(r.id, "csv", r.full_artifact_no)}>
      CSV
    </Button>
  </div>
</td>

                    <td className="border-b border-slate-100 px-2 py-2">
                      <div className="flex flex-wrap gap-2">
                        <Button variant="secondary" className="py-1.5" onClick={() => download(`/api/artifacts/${r.id}/export/?format=csv`)}>
                          CSV
                        </Button>
                        <Button variant="secondary" className="py-1.5" onClick={() => download(`/api/artifacts/${r.id}/export/?format=xlsx`)}>
                          Excel
                        </Button>
                        <Button variant="secondary" className="py-1.5" onClick={() => download(`/api/artifacts/${r.id}/export/?format=pdf`)}>
                          PDF
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!rows.length ? (
                  <tr>
                    <td colSpan={10} className="px-2 py-6 text-center text-sm text-slate-600">
                      Kayıt yok.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <Pagination page={page} pageSize={pageSize} count={count} onPageChange={(p) => setPage(Math.max(1, p))} />

          {msg ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {msg}
            </div>
          ) : null}

          {err ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {err}
            </div>
          ) : null}
        </CardBody>
      </Card>

      <ArtifactDetailModal
        open={detailOpen}
        artifact={detailRow}
        onClose={() => {
          setDetailOpen(false);
          setDetailRow(null);
        }}
      />
    </div>
  );
}
