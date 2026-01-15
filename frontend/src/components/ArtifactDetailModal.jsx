import React, { useEffect, useMemo, useState } from "react";
import { DETAILS_SCHEMA, MEASUREMENT_SCHEMA, ENUMS, UNITS } from "../schemas/artifactSchemas.js";
import KeyValueRow from "./KeyValueRow.jsx";
import { apiGet } from "../api";


function InlineModal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="text-base font-semibold text-slate-900">{title}</div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Kapat
          </button>
        </div>
        <div className="max-h-[80vh] overflow-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-6">
      <div className="mb-2 text-sm font-semibold text-slate-900">{title}</div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">{children}</div>
    </div>
  );
}

function normalizeOptions(options) {
  if (!Array.isArray(options)) return [];
  return options
    .map((o) => {
      if (o == null) return null;
      if (typeof o === "string" || typeof o === "number") return { value: o, label: String(o) };
      if (typeof o === "object") return { value: o.value, label: o.label ?? String(o.value) };
      return null;
    })
    .filter(Boolean);
}

function findLabel(options, value) {
  const opts = normalizeOptions(options);
  const v = String(value);
  const hit = opts.find((o) => String(o.value) === v);
  return hit ? hit.label : value;
}

function adaptFieldDef(fd) {
  const base = {
    key: fd.key,
    label: fd.label || fd.key,
    required: !!fd.required,
    readonly: !!fd.readonly,
    helpText: fd.help_text || "",
    fullWidth: !!fd.full_width,
    order: typeof fd.order === "number" ? fd.order : 999,
  };

  if (fd.unit_group) {
    return { ...base, kind: "measure", unitKey: `${fd.key}_unit`, unitType: fd.unit_group };
  }
  if (fd.data_type === "text") return { ...base, kind: "textarea" };
  if (fd.data_type === "bool") return { ...base, kind: "bool" };
  if (fd.data_type === "date") return { ...base, kind: "date" };
  if (fd.data_type === "multiselect") return { ...base, kind: "multiselect", options: fd.choices || [] };
  if (fd.data_type === "choice" || fd.data_type === "select") {
    if (Array.isArray(fd.choices) && fd.choices.length) return { ...base, kind: "enum", options: fd.choices || [] };
    return { ...base, kind: "text" };
  }
  return { ...base, kind: "text" };
}

function formatValue(field, bucketData) {
  const data = bucketData || {};
  const v = data[field.key];

  if (v === undefined || v === null || v === "") return "";

  // measure = value + unit
  if (field.kind === "measure" || field.unitKey) {
    const unitKey = field.unitKey || `${field.key}_unit`;
    const unitType = field.unitType || "length";
    const unitValue = data[unitKey];
    const units = UNITS[unitType] || UNITS.length || [];
    const unitLabel = units.find((u) => String(u.value) === String(unitValue))?.label || unitValue || "";
    return unitLabel ? `${v} ${unitLabel}` : String(v);
  }

  if (field.kind === "bool") return v ? "Evet" : "Hayır";

  if (field.kind === "multiselect") {
    const arr = Array.isArray(v) ? v : [v];
    return arr.map((x) => findLabel(field.options || [], x)).join(", ");
  }

  if (field.kind === "enum") return findLabel(field.options || (field.enumKey ? ENUMS[field.enumKey] : []), v);

  if (typeof v === "object") return JSON.stringify(v);

  return String(v);
}

export default function ArtifactDetailModal({ open, onClose, artifact }) {
  const [formSchema, setFormSchema] = useState(null);
  const [schemaLoading, setSchemaLoading] = useState(false);

  // Map legacy form types to the schema group used in the prototype
  const effectiveFormType = useMemo(() => {
    const ft = artifact?.form_type || "";
    if (ft === "TERRACOTTA") return "SERAMIK";
    if (ft === "FIGURIN") return "SERAMIK";
    return ft;
  }, [artifact?.form_type]);

  useEffect(() => {
    const ft = artifact?.form_type;
    if (!open || !ft) {
      setFormSchema(null);
      setSchemaLoading(false);
      return;
    }

    (async () => {
      try {
        setSchemaLoading(true);
        const payload = await apiGet(`/api/forms/${ft}/schema/`);
        setFormSchema(payload);
      } catch {
        setFormSchema(null);
      } finally {
        setSchemaLoading(false);
      }
    })();
  }, [open, artifact?.form_type]);

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

    const out = [];
    const detailsSchema = DETAILS_SCHEMA[effectiveFormType] || [];
    if (detailsSchema.length) out.push({ title: "Form Detayları", bucket: "details", fields: detailsSchema });
    if (MEASUREMENT_SCHEMA?.length) out.push({ title: "Ölçü Bilgileri", bucket: "measurements", fields: MEASUREMENT_SCHEMA });
    return out;
  }, [formSchema, effectiveFormType]);

  return (
    <InlineModal open={open} onClose={onClose} title="Buluntu Detay">
      {artifact ? (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-xs text-slate-500">Anakod</div>
              <div className="text-sm font-semibold text-slate-900">{detail?.main_code_code ?? detail?.main_code_display ?? detail?.main_code || "-"}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-xs text-slate-500">Buluntu No</div>
              <div className="text-sm font-semibold text-slate-900">{artifact?.artifact_no || "-"}</div>
            </div>
          </div>

          <Section title="Genel Bilgiler">
            <KeyValueRow label="Form Türü" value={artifact?.form_type || ""} />
            <KeyValueRow label="Buluntu Tarihi" value={artifact?.finding_date || ""} />
            <KeyValueRow label="Buluntu Yeri" value={artifact?.finding_place || ""} />
            <KeyValueRow label="Plankare" value={artifact?.plankare || ""} />
            <KeyValueRow label="Tabaka" value={artifact?.layer || ""} />
            <KeyValueRow label="Seviye" value={artifact?.level || ""} />
            <KeyValueRow label="Mezar No" value={artifact?.grave_no || ""} />
            <KeyValueRow label="Kazı Env. No" value={artifact?.excavation_inv_no || ""} />
            <KeyValueRow label="Müze Env. No" value={artifact?.museum_inv_no || ""} />
            <KeyValueRow label="Form/Obje" value={artifact?.form_object || ""} />
            <KeyValueRow label="Yapım Malzemesi" value={artifact?.production_material || ""} />
            <KeyValueRow label="Buluntu Şekli" value={artifact?.finding_shape || ""} />
            <KeyValueRow label="Üretim Yeri" value={artifact?.production_site || ""} />
            <KeyValueRow label="Dönem" value={artifact?.period || ""} />
            <KeyValueRow label="Eser Tarihi" value={detail?.artifact_date || ""} />
            <KeyValueRow label="B. Yeri Diğer" value={artifact?.other_place_info || ""} />
            {"is_inventory" in artifact ? (
              <KeyValueRow label="Envanterlik" value={artifact?.is_inventory ? "Evet" : "Hayır"} />
            ) : null}
          </Section>

          {schemaLoading ? (
            <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
              Form şeması yükleniyor...
            </div>
          ) : null}

          {dynamicSections.map((sec, idx) => {
            const bucketData = sec.bucket === "measurements" ? artifact?.measurements : artifact?.details;
            return (
              <Section key={`${sec.title}-${sec.bucket}-${idx}`} title={sec.title}>
                {sec.fields.map((f) => (
                  <KeyValueRow key={f.key} label={f.label} value={formatValue(f, bucketData)} />
                ))}
              </Section>
            );
          })}
        </>
      ) : null}
    </InlineModal>
  );
}