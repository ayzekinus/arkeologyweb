import React, { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "../api.js";
import AlertModal from "../components/AlertModal.jsx";
import SchemaFields from "../components/SchemaFields.jsx";
import useAlertModal from "../hooks/useAlertModal.js";
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

function toInt(v) {
  const n = parseInt(String(v ?? "").replace(/\D/g, ""), 10);
  return Number.isFinite(n) ? n : null;
}

function unwrapResults(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.results)) return payload.results;
  return [];
}

export default function Buluntu() {
  const [anakod, setAnakod] = useState([]);
  const [forms, setForms] = useState([]);
  const [lookups, setLookups] = useState({});

  const [loading, setLoading] = useState(false);
  const { alert, showAlert, hideAlert } = useAlertModal();

  const [form, setForm] = useState({
    main_code: "",
    artifact_no: "",
    artifact_date: "",
    form_type: "",

    form_object: "",
    production_material: "",
    production_site: "",
    period: "",

    other_place_info: "",
    excavation_inv_no: "",
    museum_inv_no: "",
    finding_shape: "",
    piece_date: "",

    notes: "",
    source_and_reference: "",

    is_inventory: false,
    is_active: true,

    details: {},
    measurements: {},
    images: [],
    drawings: [],
  });

  const selectedMainCode = useMemo(() => {
    const id = String(form.main_code || "");
    return anakod.find((a) => String(a.id) === id) || null;
  }, [anakod, form.main_code]);

  const effectiveFormType = useMemo(() => {
    // Local prototype schemas: map newer form keys to closest existing schemas
    const ft = form.form_type || "GENEL";
    if (ft === "TERRACOTTA" || ft === "FIGURIN") return "SERAMIK";
    if (ft === "CAM_METAL") return "GENEL";
    return ft;
  }, [form.form_type]);

  const [formSchema, setFormSchema] = useState(null);
  const [schemaMissing, setSchemaMissing] = useState(false);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [schemaError, setSchemaError] = useState(null);

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
        setSchemaMissing(!(payload && Array.isArray(payload.sections) && payload.sections.length));
} catch (e) {
        setFormSchema(null);
        setSchemaError(e?.message || "Form şeması yüklenemedi.");
      } finally {
        setSchemaLoading(false);
      }
    })();
  }, [form.form_type]);

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

    // Measurements: render value + unit (unit stored as "<key>_unit")
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
      if (Array.isArray(options) && options.length) {
        return { ...base, kind: "enum", options };
      }
      return { ...base, kind: "text" };
    }

    return { ...base, kind: "text" };
  }

  const dynamicSections = useMemo(() => {
    // FormBuilder strict mode: only server-driven schema renders dynamic sections.
    if (formSchema?.sections?.length) {
      const out = [];
      for (const sec of formSchema.sections) {
        const byBucket = {};
        for (const fd of sec.fields || []) {
          const bucket =
            fd.bucket ||
            (sec.section_type === "measurement" ? "measurement" : "details");
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
  }, [formSchema, effectiveFormType, lookups]);

  function renderDynamicFormSections() {
    if (schemaLoading) {
      return (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          Form şeması yükleniyor...
        </div>
      );
    }

    if (schemaError) {
      return (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {schemaError}
        </div>
      );
    }

    if (!dynamicSections.length) return null;

    return dynamicSections.map((sec, idx) => {
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
    });
  }


  useEffect(() => {
    (async () => {
      try {
        // Main codes for select
        const mc = await apiGet("/api/main-codes/?page_size=1000&ordering=code");
        setAnakod(unwrapResults(mc));

        // Forms (admin-managed)
        const [f, lookupPayload] = await Promise.all([
          apiGet("/api/forms/?page_size=200&ordering=order"),
          apiGet("/api/lookups/"),
        ]);
        const fr = unwrapResults(f);
        setForms(fr);
        setLookups(lookupPayload || {});

        // Default form type: first form (or GENEL)
        if (fr.length) {
          setForm((p) => ({ ...p, form_type: p.form_type || fr[0].key }));
        } else {
          setForm((p) => ({ ...p, form_type: p.form_type || "" }));
        }
      } catch (e) {
        showAlert({ type: "error", message: e.message || "Veriler yüklenemedi." });
      }
    })();
  }, []);

  function setField(k, v) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  function setDetail(k, v) {
    setForm((p) => ({ ...p, details: { ...(p.details || {}), [k]: v } }));
  }

  function setMeasurement(k, v) {
    setForm((p) => ({ ...p, measurements: { ...(p.measurements || {}), [k]: v } }));
  }

  async function onSave(e) {
    e.preventDefault();
    hideAlert();

    const mcId = toInt(form.main_code);
    const no = toInt(form.artifact_no);
    if (!mcId) return showAlert({ type: "error", message: "Anakod zorunludur." });
    if (!no) return showAlert({ type: "error", message: "Buluntu No zorunludur." });
    if (!form.artifact_date) return showAlert({ type: "error", message: "Buluntu Tarihi zorunludur." });
    if (!form.form_type) return showAlert({ type: "error", message: "Form zorunludur." });
    if (!form.form_object) return showAlert({ type: "error", message: "Form/Obje zorunludur." });
    if (!form.production_material) return showAlert({ type: "error", message: "Yapım Malzemesi zorunludur." });

    setLoading(true);
    try {
      // Best-effort uniqueness check (endpoint may not exist in early envs)
      try {
        await apiGet(`/api/artifacts/check-unique/?main_code=${mcId}&artifact_no=${no}`);
      } catch {
        // ignore; server will validate on POST
      }

      const payload = {
        main_code: mcId,
        artifact_no: no,
        artifact_date: form.artifact_date,
        form_type: form.form_type,

        form_object: form.form_object || null,
        production_material: form.production_material || null,
        production_site: form.production_site || null,
        period: form.period || null,

        other_place_info: form.other_place_info || null,
        excavation_inv_no: form.excavation_inv_no || null,
        museum_inv_no: form.museum_inv_no || null,
        finding_shape: form.finding_shape || null,
        piece_date: form.piece_date || null,

        notes: form.notes || null,
        source_and_reference: form.source_and_reference || null,

        is_inventory: !!form.is_inventory,
        is_active: !!form.is_active,

        details: form.details || {},
        measurements: form.measurements || {},
        images: form.images || [],
        drawings: form.drawings || [],
      };

      const saved = await apiPost("/api/artifacts/", payload);
      const fullNo =
        saved?.full_artifact_no || `${saved?.main_code_code || ""}${formatArtifactNo(saved?.artifact_no || no)}`;
      showAlert({ type: "success", message: `${fullNo} buluntu numarası başarıyla kayıt edildi.` });

      // Reset most fields; keep Anakod + Form for rapid data entry
      setForm((p) => ({
        ...p,
        artifact_no: "",
        artifact_date: "",
        form_object: "",
        other_place_info: "",
        excavation_inv_no: "",
        museum_inv_no: "",
        finding_shape: "",
        piece_date: "",
        notes: "",
        source_and_reference: "",
        details: {},
        measurements: {},
        images: [],
        drawings: [],
      }));
    } catch (e2) {
      showAlert({ type: "error", message: e2.message || "Kayıt başarısız." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Buluntu Oluştur</h1>
      </div>

      <form onSubmit={onSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Genel Bilgiler</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-slate-700">Anakod</label>
                <div className="mt-1.5">
                  <Select required value={form.main_code} onChange={(e) => setField("main_code", e.target.value)}>
                    <option value="">Seçiniz...</option>
                    {anakod.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.code} — {a.finding_place_label || ""}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Buluntu No</label>
                <div className="mt-1.5">
                  <Input
                    required
                    value={formatArtifactNo(form.artifact_no)}
                    onChange={(e) => setField("artifact_no", e.target.value)}
                    placeholder="001"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Buluntu Tarihi</label>
                <div className="mt-1.5">
                  <Input required type="date" value={form.artifact_date} onChange={(e) => setField("artifact_date", e.target.value)} />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Form</label>
                <div className="mt-1.5">
                  <Select required disabled={!forms.length} value={form.form_type} onChange={(e) => setField("form_type", e.target.value)}>
                    <option value="">Seçiniz...</option>
                    {forms.length ? (
                      forms.map((f) => (
                        <option key={f.key} value={f.key}>
                          {f.title}
                        </option>
                      ))
                    ) : (
                      <option value="">Form bulunamadı — Admin panelden ekleyin</option>
                    )}
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Buluntu Yeri (Anakod)</label>
                <div className="mt-1.5">
                  <Input value={selectedMainCode?.finding_place_label || ""} readOnly placeholder="Anakod seçiniz" />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">PlanKare (Anakod)</label>
                <div className="mt-1.5">
                  <Input value={selectedMainCode?.plan_square || ""} readOnly />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Tabaka (Anakod)</label>
                <div className="mt-1.5">
                  <Input value={selectedMainCode?.layer || ""} readOnly />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Seviye (Anakod)</label>
                <div className="mt-1.5">
                  <Input value={selectedMainCode?.level || ""} readOnly />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Mezar No (Anakod)</label>
                <div className="mt-1.5">
                  <Input value={selectedMainCode?.grave_no || ""} readOnly />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Form/Obje</label>
                <div className="mt-1.5">
                  <Select required value={form.form_object} onChange={(e) => setField("form_object", e.target.value)}>
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
                  <Select required value={form.production_material} onChange={(e) => setField("production_material", e.target.value)}>
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
                  <Select value={form.production_site} onChange={(e) => setField("production_site", e.target.value)}>
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
                  <Select value={form.period} onChange={(e) => setField("period", e.target.value)}>
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
                <label className="text-sm font-semibold text-slate-700">Buluntu Şekli</label>
                <div className="mt-1.5">
                  <Input value={form.finding_shape} onChange={(e) => setField("finding_shape", e.target.value)} />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Kazı Env. No</label>
                <div className="mt-1.5">
                  <Input value={form.excavation_inv_no} onChange={(e) => setField("excavation_inv_no", e.target.value)} />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Müze Env. No</label>
                <div className="mt-1.5">
                  <Input value={form.museum_inv_no} onChange={(e) => setField("museum_inv_no", e.target.value)} />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Eser Tarihi</label>
                <div className="mt-1.5">
                  <Input value={form.piece_date} onChange={(e) => setField("piece_date", e.target.value)} placeholder="(metin)" />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">B. Yeri Diğer</label>
                <div className="mt-1.5">
                  <Input value={form.other_place_info} onChange={(e) => setField("other_place_info", e.target.value)} />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-slate-700">Notlar / Açıklama</label>
                <div className="mt-1.5">
                  <Textarea value={form.notes} onChange={(e) => setField("notes", e.target.value)} rows={3} />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-slate-700">Kaynak / Referans</label>
                <div className="mt-1.5">
                  <Textarea value={form.source_and_reference} onChange={(e) => setField("source_and_reference", e.target.value)} rows={3} />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="is_inventory"
                  type="checkbox"
                  checked={!!form.is_inventory}
                  onChange={(e) => setField("is_inventory", e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                <label htmlFor="is_inventory" className="text-sm font-semibold text-slate-700">
                  Envanterlik
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="is_active"
                  type="checkbox"
                  checked={!!form.is_active}
                  onChange={(e) => setField("is_active", e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                <label htmlFor="is_active" className="text-sm font-semibold text-slate-700">
                  Aktif
                </label>
              </div>
            </div>
          </CardBody>
        </Card>

        {renderDynamicFormSections()}

        

        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>
            {loading ? "Kaydediliyor..." : "Buluntu Kaydet"}
          </Button>
        </div>
      </form>

      <AlertModal open={alert.open} type={alert.type} title={alert.title} message={alert.message} onClose={hideAlert} />
    </div>
  );
}
