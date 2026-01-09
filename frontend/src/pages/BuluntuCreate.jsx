import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { apiGet, apiPost, apiPatch } from "../api.js";
import SchemaFields from "../components/SchemaFields.jsx";
import { DETAILS_SCHEMA, MEASUREMENT_SCHEMA } from "../schemas/artifactSchemas.js";

import { Card, CardHeader, CardBody, CardTitle } from "../ui/Card.jsx";
import Button from "../ui/Button.jsx";
import Input from "../ui/Input.jsx";
import Select from "../ui/Select.jsx";
import Textarea from "../ui/Textarea.jsx";

function pad4(n) {
  const s = String(n ?? "").replace(/\D/g, "");
  if (!s) return "";
  return s.length >= 4 ? s : s.padStart(4, "0");
}

export default function BuluntuCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id");

  const [anakod, setAnakod] = useState([]);

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const [uniqueHint, setUniqueHint] = useState("");
  const [uniqueError, setUniqueError] = useState(false);

  const [editingId, setEditingId] = useState(null);

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

  async function loadArtifactForEdit(id) {
    const data = await apiGet(`/api/artifacts/${id}/`);
    setEditingId(data.id);
    setForm({
      main_code: data.main_code ?? "",
      artifact_no: data.artifact_no ?? "",
      artifact_date: data.artifact_date ?? "",
      form_type: data.form_type ?? "GENEL",
      production_material: data.production_material ?? "",
      period: data.period ?? "",
      is_inventory: !!data.is_inventory,
      is_active: data.is_active !== false,
      notes: data.notes ?? "",
      source_and_reference: data.source_and_reference ?? "",
      piece_date: data.piece_date ?? "",
      details: data.details || {},
      measurements: data.measurements || {},
      images: data.images || [],
      drawings: data.drawings || [],
    });
  }

  useEffect(() => {
    loadMainCodes().catch((e) => setErr(e.message || "Anakodlar yüklenemedi."));
  }, []);

  useEffect(() => {
    if (!editId) {
      setEditingId(null);
      return;
    }
    loadArtifactForEdit(editId).catch((e) => setErr(e.message || "Buluntu yüklenemedi."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

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

      // reset (keep main_code)
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

      if (editingId) {
        setEditingId(null);
        navigate("/buluntu/listele");
      }
    } catch (e3) {
      setErr(e3.message || "İşlem başarısız.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Buluntu {editingId ? "Güncelle" : "Oluştur"}</h1>
          <p className="mt-1 text-sm text-slate-600">Buluntu bilgilerini kaydedin.</p>
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" type="button" onClick={() => navigate("/buluntu/listele")}>
            Listeye Git
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Genel Bilgiler</CardTitle>
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
    </div>
  );
}
