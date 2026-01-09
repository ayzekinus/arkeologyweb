import React, { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost, apiPatch, apiDelete } from "../api.js";
import SchemaFields from "../components/SchemaFields.jsx";
import ArtifactDetailModal from "../components/ArtifactDetailModal.jsx";
import { DETAILS_SCHEMA, MEASUREMENT_SCHEMA } from "../schemas/artifactSchemas.js";

import { Card, CardHeader, CardBody, CardTitle } from "../ui/Card.jsx";
import Button from "../ui/Button.jsx";
import Input from "../ui/Input.jsx";
import Select from "../ui/Select.jsx";
import Textarea from "../ui/Textarea.jsx";
import Pagination from "../ui/Pagination.jsx";

function pad4(n) {
  const s = String(n ?? "").replace(/\D/g, "");
  if (!s) return "";
  return s.length >= 4 ? s : s.padStart(4, "0");
}

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

export default function Buluntu() {
  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);

  const [anakod, setAnakod] = useState([]);

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const [uniqueHint, setUniqueHint] = useState("");
  const [uniqueError, setUniqueError] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRow, setDetailRow] = useState(null);

  const [editingId, setEditingId] = useState(null);

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

  const [form, setForm] = useState({
    main_code: "",
    artifact_no: "",
    artifact_date: "",
    form_type: "GENEL",
    production_material: "",
    period: "",
    is_inventory: false,
    is_active: true,
    notes: "",
    source_and_reference: "",
    piece_date: "",
    details: {},
    measurements: {},
    images: [],
    drawings: [],
  });

  const fullNoPreview = useMemo(() => {
    const mc = anakod.find((a) => String(a.id) === String(form.main_code));
    const code = mc?.code || "";
    const no = pad4(form.artifact_no);
    return code && no ? `${code}${no}` : "";
  }, [anakod, form.main_code, form.artifact_no]);

  async function loadMainCodes() {
    const data = await apiGet("/api/main-codes/?page_size=500");
    setAnakod((data.results || data) ?? []);
  }

  async function loadArtifacts(nextPage = page) {
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

  async function refresh() {
    try {
      await Promise.all([loadMainCodes(), loadArtifacts(1)]);
      setPage(1);
    } catch (e) {
      setErr(e.message || "Veriler yüklenemedi.");
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch list when controls change (but not on every draft change; only applied filters)
  useEffect(() => {
    loadArtifacts(page).catch((e) => setErr(e.message || "Liste yüklenemedi."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, ordering, filters]);

  async function checkUnique(main_code, artifact_no) {
    const mc = main_code;
    const noInt = parseInt(pad4(artifact_no), 10);
    if (!mc || !noInt) {
      setUniqueHint("");
      setUniqueError(false);
      return;
    }
    try {
      const res = await apiGet(
        `/api/artifacts/check-unique/?main_code=${encodeURIComponent(mc)}&artifact_no=${encodeURIComponent(
          noInt
        )}${editingId ? `&exclude_id=${encodeURIComponent(editingId)}` : ""}`
      );
      if (res.exists) {
        setUniqueError(true);
        setUniqueHint("Bu Anakod için bu Buluntu No zaten mevcut.");
      } else {
        setUniqueError(false);
        setUniqueHint("Uygun.");
      }
    } catch {
      setUniqueHint("");
      setUniqueError(false);
    }
  }

  useEffect(() => {
    checkUnique(form.main_code, form.artifact_no);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.main_code, form.artifact_no, editingId]);

  function setDetail(k, v) {
    setForm((p) => ({ ...p, details: { ...(p.details || {}), [k]: v } }));
  }
  function setMeasure(k, v) {
    setForm((p) => ({ ...p, measurements: { ...(p.measurements || {}), [k]: v } }));
  }

  function renderFormFields() {
    const schema = DETAILS_SCHEMA[form.form_type] || [];
    if (!schema.length) return null;
    const title = form.form_type === "GENEL" ? "Form Detayları" : `${form.form_type} Detayları`;
    return <SchemaFields title={title} schema={schema} data={form.details || {}} onChange={setDetail} />;
  }

  function renderMeasurements() {
    return (
      <SchemaFields
        title="Ölçü Bilgileri"
        schema={MEASUREMENT_SCHEMA}
        data={form.measurements || {}}
        onChange={setMeasure}
      />
    );
  }

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");
    setErr("");

    const no = pad4(form.artifact_no);
    if (!form.main_code || !no || !form.artifact_date) {
      setErr("Anakod, Buluntu No ve Buluntu Tarihi zorunludur.");
      return;
    }
    if (uniqueError) {
      setErr("Buluntu No benzersiz olmalıdır. Lütfen farklı bir numara deneyin.");
      return;
    }

    const payload = { ...form, artifact_no: parseInt(no, 10) };

    try {
      let saved = null;
      if (editingId) {
        saved = await apiPatch(`/api/artifacts/${editingId}/`, payload);
        setMsg(`${saved.full_artifact_no} buluntu başarı ile güncellendi.`);
      } else {
        saved = await apiPost("/api/artifacts/", payload);
        setMsg(`${saved.full_artifact_no} buluntu başarı ile kaydedildi.`);
      }

      // Refresh list but keep current page/filters
      await loadArtifacts(page);

      if (editingId) setEditingId(null);

      setForm((prev) => ({
        main_code: prev.main_code,
        artifact_no: "",
        artifact_date: "",
        form_type: "GENEL",
        production_material: "",
        period: "",
        is_inventory: false,
        is_active: true,
        notes: "",
        source_and_reference: "",
        piece_date: "",
        details: {},
        measurements: {},
        images: [],
        drawings: [],
      }));
      setUniqueHint("");
      setUniqueError(false);
    } catch (e3) {
      setErr(e3.message || "İşlem başarısız.");
    }
  }

  function startEdit(row) {
    setMsg("");
    setErr("");
    setEditingId(row.id);
    setForm({
      main_code: row.main_code ?? "",
      artifact_no: row.artifact_no ?? "",
      artifact_date: row.artifact_date ?? "",
      form_type: row.form_type ?? "GENEL",
      production_material: row.production_material ?? "",
      period: row.period ?? "",
      is_inventory: !!row.is_inventory,
      is_active: row.is_active !== false,
      notes: row.notes ?? "",
      source_and_reference: row.source_and_reference ?? "",
      piece_date: row.piece_date ?? "",
      details: row.details || {},
      measurements: row.measurements || {},
      images: row.images || [],
      drawings: row.drawings || [],
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setMsg("");
    setErr("");
    setForm((prev) => ({
      ...prev,
      artifact_no: "",
      artifact_date: "",
      form_type: "GENEL",
      production_material: "",
      period: "",
      is_inventory: false,
      is_active: true,
      notes: "",
      source_and_reference: "",
      piece_date: "",
      details: {},
      measurements: {},
      images: [],
      drawings: [],
    }));
    setUniqueHint("");
    setUniqueError(false);
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
      await loadArtifacts(page);
    } catch (e) {
      setErr(e.message || "Silme başarısız.");
    }
  }

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

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold">Buluntu</h1>
        <p className="mt-1 text-sm text-slate-600">Buluntu oluşturma, düzenleme ve listeleme.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Buluntu Güncelle" : "Buluntu Oluştur"}</CardTitle>
        </CardHeader>
        <CardBody>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-slate-700">Anakod</label>
                <div className="mt-1.5">
                  <Select
                    required
                    value={form.main_code}
                    onChange={(e) => setForm((p) => ({ ...p, main_code: e.target.value }))}
                  >
                    <option value="">Seçiniz...</option>
                    {anakod.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.code} — {a.finding_place}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Buluntu Numarası</label>
                <div className="mt-1.5">
                  <Input
                    required
                    value={pad4(form.artifact_no)}
                    onChange={(e) => setForm((p) => ({ ...p, artifact_no: e.target.value }))}
                    placeholder="0001"
                  />
                </div>
                {fullNoPreview ? (
                  <div className="mt-1 text-xs text-slate-500">
                    Önizleme: <span className="font-semibold text-slate-800">{fullNoPreview}</span>
                  </div>
                ) : null}
                {uniqueHint ? (
                  <div className={`mt-1 text-xs ${uniqueError ? "text-rose-700" : "text-emerald-700"}`}>
                    {uniqueHint}
                  </div>
                ) : null}
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Buluntu Tarihi</label>
                <div className="mt-1.5">
                  <Input
                    type="date"
                    required
                    value={form.artifact_date}
                    onChange={(e) => setForm((p) => ({ ...p, artifact_date: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Form</label>
                <div className="mt-1.5">
                  <Select
                    value={form.form_type}
                    onChange={(e) => setForm((p) => ({ ...p, form_type: e.target.value, details: {} }))}
                  >
                    <option value="GENEL">Genel</option>
                    <option value="SIKKE">Sikke</option>
                    <option value="SERAMIK">Seramik</option>
                    <option value="MEZAR">Mezar</option>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Yapım Malzemesi</label>
                <div className="mt-1.5">
                  <Input
                    value={form.production_material}
                    onChange={(e) => setForm((p) => ({ ...p, production_material: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Dönem</label>
                <div className="mt-1.5">
                  <Input value={form.period} onChange={(e) => setForm((p) => ({ ...p, period: e.target.value }))} />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Eser Tarihi</label>
                <div className="mt-1.5">
                  <Input value={form.piece_date} onChange={(e) => setForm((p) => ({ ...p, piece_date: e.target.value }))} />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-6">
                <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={!!form.is_inventory}
                    onChange={(e) => setForm((p) => ({ ...p, is_inventory: e.target.checked }))}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  Envanterlik
                </label>

                <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={!!form.is_active}
                    onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  Aktif
                </label>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-slate-700">Kaynak / Referans</label>
                <div className="mt-1.5">
                  <Textarea
                    rows={3}
                    value={form.source_and_reference}
                    onChange={(e) => setForm((p) => ({ ...p, source_and_reference: e.target.value }))}
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-slate-700">Notlar / Açıklama</label>
                <div className="mt-1.5">
                  <Textarea rows={3} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
                </div>
              </div>
            </div>

            {renderFormFields()}
            {renderMeasurements()}

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="primary" type="submit">
                {editingId ? "Buluntu Güncelle" : "Buluntu Kaydet"}
              </Button>

              {editingId ? (
                <Button variant="secondary" type="button" onClick={cancelEdit}>
                  İptal
                </Button>
              ) : null}

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
            </div>
          </form>
        </CardBody>
      </Card>

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

            <Button variant="secondary" onClick={() => refresh()}>
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
                  {["Tam No", "Anakod", "Buluntu Yeri", "Buluntu No", "Buluntu Tarihi", "Form", "Malzeme", "Dönem", "Detay"].map((h) => (
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
                        <Button variant="secondary" className="py-1.5" onClick={() => startEdit(r)}>
                          Düzenle
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
                    <td colSpan={9} className="px-2 py-6 text-center text-sm text-slate-600">
                      Kayıt yok.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <Pagination page={page} pageSize={pageSize} count={count} onPageChange={(p) => setPage(Math.max(1, p))} />
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
