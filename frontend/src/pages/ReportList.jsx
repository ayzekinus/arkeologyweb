import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiDelete, apiGet } from "../api.js";
import { IconCsv, IconDelete, IconEdit, IconPdf, IconView, IconXls } from "../ui/Icons.jsx";
import { Card, CardHeader, CardBody, CardTitle } from "../ui/Card.jsx";
import Button from "../ui/Button.jsx";
import Input from "../ui/Input.jsx";
import Select from "../ui/Select.jsx";
import Pagination from "../ui/Pagination.jsx";

const REPORT_TYPES = [
  { value: "", label: "Tümü" },
  { value: "GENEL", label: "Genel" },
  { value: "KAZI", label: "Kazı" },
  { value: "LAB", label: "Laboratuvar" },
  { value: "KONSERVASYON", label: "Konservasyon" },
  { value: "DIGER", label: "Diğer" },
];
const REPORT_TYPE_LABELS = REPORT_TYPES.reduce((acc, item) => {
  if (item.value) acc[item.value] = item.label;
  return acc;
}, {});

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
  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export default function ReportList() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [findingPlaceOptions, setFindingPlaceOptions] = useState([]);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [ordering, setOrdering] = useState("-created_at");

  const [filters, setFilters] = useState({
    q: "",
    report_type: "",
    finding_place: "",
    study_year: "",
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
    const data = await apiGet(`/api/reports/?${q}`);
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

  useEffect(() => {
    apiGet("/api/lookups/?keys=FINDING_PLACE")
      .then((data) => setFindingPlaceOptions(data?.FINDING_PLACE ?? []))
      .catch((e) => setErr(e.message || "Buluntu yeri listesi alınamadı."));
  }, []);

  function applyFilters() {
    setFilters({ ...filterDraft });
    setPage(1);
  }

  function clearFilters() {
    const empty = {
      q: "",
      report_type: "",
      finding_place: "",
      study_year: "",
    };
    setFilterDraft(empty);
    setFilters(empty);
    setPage(1);
  }

  async function onDelete(id) {
    if (!confirm("Silmek istediğinize emin misiniz?")) return;
    try {
      await apiDelete(`/api/reports/${id}/`);
      setMsg("Rapor silindi.");
      load(page).catch((e) => setErr(e.message || "Liste yüklenemedi."));
    } catch (e) {
      setErr(e.message || "Silme başarısız.");
    }
  }

  function onExport(id, format) {
    if (!id) {
      setErr("Export için kayıt id bulunamadı.");
      return;
    }
    download(`/api/reports/${id}/export?format=${format}`);
    setMsg(`Export başlatıldı: report-${id}.${format}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Rapor Listele</h1>
          <p className="mt-1 text-sm text-slate-600">Raporlar üzerinde filtreleme yapın.</p>
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" type="button" onClick={() => navigate("/rapor/olustur")}>
            Yeni Rapor
          </Button>
        </div>
      </div>

      {msg ? <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{msg}</div> : null}
      {err ? <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{err}</div> : null}

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle>Rapor Listesi</CardTitle>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={ordering} onChange={(e) => setOrdering(e.target.value)}>
              <option value="-created_at">Sıralama: Yeni → Eski</option>
              <option value="created_at">Sıralama: Eski → Yeni</option>
              <option value="-writing_date">Yazım Tarihi: Yeni → Eski</option>
              <option value="writing_date">Yazım Tarihi: Eski → Yeni</option>
            </Select>
            <Select value={String(pageSize)} onChange={(e) => setPageSize(parseInt(e.target.value, 10))}>
              {[10, 20, 50].map((n) => (
                <option key={n} value={n}>
                  {n} / sayfa
                </option>
              ))}
            </Select>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div>
              <label className="text-sm font-semibold text-slate-700">Genel Arama</label>
              <div className="mt-1.5">
                <Input
                  value={filterDraft.q}
                  onChange={(e) => setFilterDraft((prev) => ({ ...prev, q: e.target.value }))}
                  placeholder="Başlık, hazırlayan..."
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">Rapor Tipi</label>
              <div className="mt-1.5">
                <Select
                  value={filterDraft.report_type}
                  onChange={(e) => setFilterDraft((prev) => ({ ...prev, report_type: e.target.value }))}
                >
                  {REPORT_TYPES.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">Buluntu Yeri</label>
              <div className="mt-1.5">
                <Select
                  value={filterDraft.finding_place}
                  onChange={(e) => setFilterDraft((prev) => ({ ...prev, finding_place: e.target.value }))}
                >
                  <option value="">Tümü</option>
                  {findingPlaceOptions.map((place) => (
                    <option key={String(place.id)} value={String(place.id)}>
                      {place.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">Çalışma Yılı</label>
              <div className="mt-1.5">
                <Input
                  inputMode="numeric"
                  value={filterDraft.study_year}
                  onChange={(e) =>
                    setFilterDraft((prev) => ({
                      ...prev,
                      study_year: e.target.value.replace(/\D/g, "").slice(0, 4),
                    }))
                  }
                  placeholder="2024"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={applyFilters}>
              Filtrele
            </Button>
            <Button type="button" variant="secondary" onClick={clearFilters}>
              Temizle
            </Button>
          </div>

          <div className="overflow-auto rounded-xl border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-3">Başlık</th>
                  <th className="px-4 py-3">Rapor Tipi</th>
                  <th className="px-4 py-3">Hazırlayan</th>
                  <th className="px-4 py-3">Buluntu Yeri</th>
                  <th className="px-4 py-3">Çalışma Yılı</th>
                  <th className="px-4 py-3">Yazım Tarihi</th>
                  <th className="px-4 py-3">Buluntu</th>
                  <th className="px-4 py-3">Detay</th>
                  <th className="px-4 py-3">Export</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-6 text-center text-slate-500">
                      Henüz rapor bulunmuyor.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-slate-900">{row.title}</td>
                      <td className="px-4 py-3">{REPORT_TYPE_LABELS[row.report_type] || row.report_type}</td>
                      <td className="px-4 py-3">{row.prepared_by}</td>
                      <td className="px-4 py-3">{row.finding_place_label || row.finding_place}</td>
                      <td className="px-4 py-3">{row.study_year}</td>
                      <td className="px-4 py-3">{row.writing_date}</td>
                      <td className="px-4 py-3">{row.artifact_count ?? 0}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="secondary"
                            className="py-1.5"
                            onClick={() => navigate(`/rapor/olustur?id=${row.id}&view=1`)}
                            aria-label="Görüntüle"
                            title="Görüntüle"
                          >
                            <IconView />
                          </Button>
                          <Button
                            variant="secondary"
                            className="py-1.5"
                            onClick={() => navigate(`/rapor/olustur?id=${row.id}`)}
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
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="secondary"
                            className="py-1.5"
                            onClick={() => onExport(row.id, "pdf")}
                            aria-label="PDF"
                            title="PDF"
                          >
                            <IconPdf />
                          </Button>
                          <Button
                            variant="secondary"
                            className="py-1.5"
                            onClick={() => onExport(row.id, "xlsx")}
                            aria-label="XLS"
                            title="XLS"
                          >
                            <IconXls />
                          </Button>
                          <Button
                            variant="secondary"
                            className="py-1.5"
                            onClick={() => onExport(row.id, "csv")}
                            aria-label="CSV"
                            title="CSV"
                          >
                            <IconCsv />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination page={page} pageSize={pageSize} count={count} onPageChange={setPage} />
        </CardBody>
      </Card>
    </div>
  );
}
