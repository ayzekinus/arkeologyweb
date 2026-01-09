import React, { useEffect, useState } from "react";
import { apiGet, apiDelete } from "../api.js";
import MainCodeDetailModal from "../components/MainCodeDetailModal.jsx";
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

export default function AnakodList() {
  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const [artifactDetailOpen, setArtifactDetailOpen] = useState(false);
  const [selectedArtifact, setSelectedArtifact] = useState(null);

  // list controls
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [ordering, setOrdering] = useState("-created_at");

  const [filters, setFilters] = useState({ q: "", code: "", finding_place: "" });
  const [filterDraft, setFilterDraft] = useState({ ...filters });

  async function load(nextPage = page) {
    setErr("");
    const q = buildQuery({
      ...filters,
      ordering,
      page: nextPage,
      page_size: pageSize,
    });
    const data = await apiGet(`/api/main-codes/?${q}`);
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
    const empty = { q: "", code: "", finding_place: "" };
    setFilterDraft(empty);
    setFilters(empty);
    setPage(1);
  }

  function openDetail(mc) {
    setSelected(mc);
    setDetailOpen(true);
  }

  function openArtifact(a) {
    setSelectedArtifact(a);
    setArtifactDetailOpen(true);
  }

  async function onDelete(id) {
    if (!confirm("Silmek istediğinize emin misiniz?")) return;
    setMsg("");
    setErr("");
    try {
      await apiDelete(`/api/main-codes/${id}/`);
      setMsg("Kayıt silindi.");
      await load(page);
    } catch (e) {
      setErr(e.message || "Silme başarısız.");
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold">Anakod Listele</h1>
        <p className="mt-1 text-sm text-slate-600">Server-side filtreleme ve sayfalama.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle>Anakod Listesi</CardTitle>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={ordering} onChange={(e) => setOrdering(e.target.value)}>
              <option value="-created_at">Sıralama: Yeni → Eski</option>
              <option value="created_at">Sıralama: Eski → Yeni</option>
              <option value="code">Kod: A → Z</option>
              <option value="-code">Kod: Z → A</option>
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
                  <Input value={filterDraft.q} onChange={(e) => setFilterDraft((p) => ({ ...p, q: e.target.value }))} placeholder="Kod, yer, açıklama..." />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Kod</label>
                <div className="mt-1.5">
                  <Input value={filterDraft.code} onChange={(e) => setFilterDraft((p) => ({ ...p, code: e.target.value }))} placeholder="AAA" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Buluntu Yeri</label>
                <div className="mt-1.5">
                  <Input value={filterDraft.finding_place} onChange={(e) => setFilterDraft((p) => ({ ...p, finding_place: e.target.value }))} placeholder="Açma / Alan..." />
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

          <div className="overflow-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  {["Kod", "Buluntu Yeri", "PlanKare", "Tarih", "Detay"].map((h) => (
                    <th key={h} className="border-b border-slate-200 px-2 py-2">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="border-b border-slate-100 px-2 py-2 font-semibold">{r.code}</td>
                    <td className="border-b border-slate-100 px-2 py-2">{r.finding_place}</td>
                    <td className="border-b border-slate-100 px-2 py-2">{r.plan_square || ""}</td>
                    <td className="border-b border-slate-100 px-2 py-2">{(r.created_at || "").slice(0, 10)}</td>
                    <td className="border-b border-slate-100 px-2 py-2">
                      <div className="flex flex-wrap gap-2">
                        <Button variant="secondary" className="py-1.5" onClick={() => openDetail(r)}>
                          Görüntüle
                        </Button>
                        <Button variant="danger" className="py-1.5" onClick={() => onDelete(r.id)}>
                          Sil
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!rows.length ? (
                  <tr>
                    <td colSpan={5} className="px-2 py-6 text-center text-sm text-slate-600">
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

      <MainCodeDetailModal
        open={detailOpen}
        mc={selected}
        onOpenArtifact={openArtifact}
        onClose={() => {
          setDetailOpen(false);
          setSelected(null);
        }}
      />

      <ArtifactDetailModal
        open={artifactDetailOpen}
        artifact={selectedArtifact}
        onClose={() => {
          setArtifactDetailOpen(false);
          setSelectedArtifact(null);
        }}
      />
    </div>
  );
}
