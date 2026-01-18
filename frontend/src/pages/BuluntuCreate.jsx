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

function formatArtifactNo(n) {
  const s = String(n ?? "").replace(/\D/g, "");
  if (!s) return "";
  if (s.length <= 2) return s.padStart(3, "0");
  if (s.length === 3) return s.padStart(4, "0");
  return s;
}

function unwrapResults(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.results)) return payload.results;
  return [];
}

export default function BuluntuCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id");

  const [anakod, setAnakod] = useState([]);
  const [forms, setForms] = useState([]);
  const [lookups, setLookups] = useState({});

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const [uniqueHint, setUniqueHint] = useState("");
  const [uniqueError, setUniqueError] = useState(false);

  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    main_code: "",
    artifact_no: "",
    artifact_date: "",
    form_type: "",
    form_object: "",
    production_material: "",
    production_site: "",
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

  const [formSchema, setFormSchema] = useState(null);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [schemaError, setSchemaError] = useState(null);

  const fullNoPreview = useMemo(() => {
    const mc = anakod.find((a) => String(a.id) === String(form.main_code));
    const code = mc?.code || "";
    const no = formatArtifactNo(form.artifact_no);
    return code && no ? `${code}${no}` : "";
  }, [anakod, form.main_code, form.artifact_no]);

  async function loadMainCodes() {
    const data = await apiGet("/api/main-codes/?page_size=500");
    setAnakod((data.results || data) ?? []);
  }

  async function loadForms() {
    const data = await apiGet("/api/forms/?page_size=200&ordering=order");
    setForms(unwrapResults(data));
  }

  async function loadLookups() {
    const data = await apiGet("/api/lookups/");
    setLookups(data || {});
  }

  async function loadArtifactForEdit(id) {
    const data = await apiGet(`/api/artifacts/${id}/`);
    setEditingId(data.id);
    setForm({
      main_code: data.main_code ?? "",
      artifact_no: data.artifact_no ?? "",
      artifact_date: data.artifact_date ?? "",
      form_type: data.form_type ?? "",
      form_object: data.form_object ?? "",
      production_material: data.production_material ?? "",
      production_site: data.production_site ?? "",
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
    Promise.all([loadMainCodes(), loadForms(), loadLookups()]).catch((e) =>
      setErr(e.message || "Veriler yüklenemedi.")
    );
  }, []);

  useEffect(() => {
    if (!editId) {
      setEditingId(null);
      return;
    }
    loadArtifactForEdit(editId).catch((e) => setErr(e.message || "Buluntu yüklenemedi."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  useEffect(() => {
    const ft = form.form_type;
    if (!ft) {
      setFormSchema(null);
      setSchemaError(null);
      setSchemaLoading(false);
      return;
    }

    (async () => {
      try {
        setSchemaLoading(true);
        setSchemaError(null);
        const payload = await apiGet(`/api/forms/${ft}/schema/`);
        setFormSchema(payload);
      } catch (e) {
        setFormSchema(null);
        setSchemaError(e?.message || "Form şeması yüklenemedi.");
      } finally {
        setSchemaLoading(false);
      }
    })();
  }, [form.form_type]);

  async function checkUnique(main_code, artifact_no) {
    const mc = main_code;
    const noInt = parseInt(formatArtifactNo(artifact_no), 10);
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

  function lookupOptions(key) {
    return Array.isArray(lookups?.[key]) ? lookups[key] : [];
  }

  function adaptFieldDef(fd) {
    const base = {
      key: fd.key,
      label: fd.label || fd.key,
      required: !!fd.required,
      readonly: !!fd.readonly,
      helpText: fd.help_text || "",
      fullWidth: !!fd.full_width,
      inputType: fd.data_type === "int" || fd.data_type === "decimal" ? "number" : "text",
      order: typeof fd.order === "number" ? fd.order : 999,
    };

    if (fd.unit_group) {
      return {
        ...base,
        kind: "measure",
        unitKey: `${fd.key}_unit`,
        unitType: fd.unit_group,
        unitOptions: fd.unit_options || [],
        inputType: "number",
      };
    }

    if (fd.data_type === "text") return { ...base, kind: "textarea" };
    if (fd.data_type === "bool") return { ...base, kind: "bool" };
    if (fd.data_type === "date") return { ...base, kind: "date" };

    if (fd.data_type === "multiselect") {
      const options = (fd.choices && fd.choices.length ? fd.choices : lookupOptions(fd.list_type));
      return { ...base, kind: "multiselect", options };
    }

    if (fd.data_type === "choice" || fd.data_type === "select") {
      const options = (fd.choices && fd.choices.length ? fd.choices : lookupOptions(fd.list_type));
      if (options.length) {
        return { ...base, kind: "enum", options };
      }
      return { ...base, kind: "text" };
    }

    return { ...base, kind: "text" };
  }

  const dynamicSections = useMemo(() => {
    if (formSchema?.sections?.length) {
      const out = [];
      for (const sec of formSchema.sections) {
        const byBucket = {};
        for (const fd of sec.fields || []) {
          const bucket = fd.bucket || "details";
          byBucket[bucket] ||= [];
          byBucket[bucket].push(adaptFieldDef(fd));
        }
        for (const [bucket, fields] of Object.entries(byBucket)) {
          fields.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
          out.push({ title: sec.title, bucket, fields });
        }
      }
      return out;
    }
    return [];
  }, [formSchema, lookups]);

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

    const no = formatArtifactNo(form.artifact_no);
    if (!form.main_code || !no || !form.artifact_date) {
      setErr("Anakod, Buluntu No ve Buluntu Tarihi zorunludur.");
      return;
    }
    if (uniqueError) {
      setErr("Buluntu No benzersiz olmalıdır. Lütfen farklı bir numara deneyin.");
      return;
    }

    const payload = {
      ...form,
      artifact_no: parseInt(no, 10),
      form_object: form.form_object || null,
      production_material: form.production_material || null,
      production_site: form.production_site || null,
      period: form.period || null,
    };

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
        form_type: prev.form_type,
        form_object: "",
        production_material: "",
        production_site: "",
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
                    value={formatArtifactNo(form.artifact_no)}
                    onChange={(e) => setForm((p) => ({ ...p, artifact_no: e.target.value }))}
                    placeholder="001"
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
                    <option value="">Form alanına seçiniz...</option>
                    {forms.map((f) => (
                      <option key={f.key} value={f.key}>
                        {f.title}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Form / Obje</label>
                <div className="mt-1.5">
                  <Select
                    value={form.form_object}
                    onChange={(e) => setForm((p) => ({ ...p, form_object: e.target.value }))}
                  >
                    <option value="">Seçiniz...</option>
                    {lookupOptions("FORM_OBJECT").map((o) => (
                      <option key={String(o.value)} value={String(o.value)}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Yapım Malzemesi</label>
                <div className="mt-1.5">
                  <Select
                    value={form.production_material}
                    onChange={(e) => setForm((p) => ({ ...p, production_material: e.target.value }))}
                  >
                    <option value="">Seçiniz...</option>
                    {lookupOptions("PRODUCTION_MATERIAL").map((o) => (
                      <option key={String(o.value)} value={String(o.value)}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Üretim Yeri</label>
                <div className="mt-1.5">
                  <Select
                    value={form.production_site}
                    onChange={(e) => setForm((p) => ({ ...p, production_site: e.target.value }))}
                  >
                    <option value="">Seçiniz...</option>
                    {lookupOptions("PRODUCTION_SITE").map((o) => (
                      <option key={String(o.value)} value={String(o.value)}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Dönem</label>
                <div className="mt-1.5">
                  <Select value={form.period} onChange={(e) => setForm((p) => ({ ...p, period: e.target.value }))}>
                    <option value="">Seçiniz...</option>
                    {lookupOptions("PERIOD").map((o) => (
                      <option key={String(o.value)} value={String(o.value)}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
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

            {schemaLoading ? (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                Form şeması yükleniyor...
              </div>
            ) : null}

            {schemaError ? (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                {schemaError}
              </div>
            ) : null}

            {dynamicSections.length
              ? dynamicSections.map((sec, idx) => {
                  const bucketData = sec.bucket === "measurements" ? form.measurements : form.details;
                  const onBucketChange =
                    sec.bucket === "measurements"
                      ? (key, value) =>
                          setForm((prev) => ({ ...prev, measurements: { ...(prev.measurements || {}), [key]: value } }))
                      : (key, value) =>
                          setForm((prev) => ({ ...prev, details: { ...(prev.details || {}), [key]: value } }));

                  return (
                    <SchemaFields
                      key={`${sec.title}-${sec.bucket}-${idx}`}
                      title={sec.title}
                      schema={sec.fields}
                      data={bucketData || {}}
                      onChange={onBucketChange}
                    />
                  );
                })
              : null}

            {!schemaLoading && !schemaError && !dynamicSections.length ? (
              <>
                {renderFormFields()}
                {renderMeasurements()}
              </>
            ) : null}

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
