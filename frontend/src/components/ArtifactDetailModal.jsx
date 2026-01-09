import React from "react";
import Modal from "./Modal.jsx";
import Row from "./KeyValueRow.jsx";
import { DETAILS_SCHEMA, MEASUREMENT_SCHEMA, ENUMS } from "../schemas/artifactSchemas.js";

function formatEnum(enumKey, value) {
  if (value === null || value === undefined || value === "") return "";
  const map = ENUMS[enumKey] || {};
  const k = String(value);
  return map[k] ?? map[Number(k)] ?? String(value);
}

function formatValueWithUnit(obj, key, unitKey) {
  const v = obj?.[key];
  const u = obj?.[unitKey];
  if (v === null || v === undefined || v === "") return "";
  return [v, u].filter(Boolean).join(" ");
}

function pickExtraPairs(obj, usedKeys) {
  const extras = [];
  if (!obj || typeof obj !== "object") return extras;
  for (const [k, v] of Object.entries(obj)) {
    if (usedKeys.has(k)) continue;
    if (v === null || v === undefined || v === "") continue;
    extras.push([k, v]);
  }
  return extras;
}

function Section({ title, children }) {
  return (
    <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-2 font-extrabold">{title}</div>
      {children}
    </div>
  );
}

function DetailsPretty({ row }) {
  const d = row?.details || {};
  const schema = DETAILS_SCHEMA[row?.form_type] || [];
  const used = new Set();
  const rows = [];

  for (const f of schema) {
    used.add(f.key);
    if (f.unitKey) used.add(f.unitKey);

    let val = "";
    if (f.enumKey) val = formatEnum(f.enumKey, d[f.key]);
    else if (f.unitKey) val = formatValueWithUnit(d, f.key, f.unitKey);
    else val = d[f.key];

    if (val === null || val === undefined || val === "") continue;
    rows.push(<Row key={f.key} label={f.label} value={String(val)} />);
  }

  const extras = pickExtraPairs(d, used);
  if (!rows.length && !extras.length) return null;

  return (
    <Section title="Form Detayları">
      {rows.length ? rows : <div className="text-sm text-slate-600">Bu forma ait detay bilgisi yok.</div>}
      {extras.length ? (
        <div className="mt-3 border-t border-dashed border-slate-200 pt-3">
          <div className="mb-2 text-sm font-extrabold">Ek Alanlar</div>
          {extras.map(([k, v]) => (
            <Row key={k} label={k} value={typeof v === "object" ? JSON.stringify(v) : String(v)} />
          ))}
        </div>
      ) : null}
    </Section>
  );
}

function MeasurementsPretty({ row }) {
  const m = row?.measurements || {};
  const used = new Set();
  const rows = [];

  for (const f of MEASUREMENT_SCHEMA) {
    used.add(f.key);
    if (f.unitKey) used.add(f.unitKey);
    const val = formatValueWithUnit(m, f.key, f.unitKey);
    if (!val) continue;
    rows.push(<Row key={f.key} label={f.label} value={val} />);
  }

  const extras = pickExtraPairs(m, used);
  if (!rows.length && !extras.length) return null;

  return (
    <Section title="Ölçü Bilgileri">
      {rows.length ? rows : <div className="text-sm text-slate-600">Ölçü bilgisi yok.</div>}
      {extras.length ? (
        <div className="mt-3 border-t border-dashed border-slate-200 pt-3">
          <div className="mb-2 text-sm font-extrabold">Ek Ölçüler</div>
          {extras.map(([k, v]) => (
            <Row key={k} label={k} value={typeof v === "object" ? JSON.stringify(v) : String(v)} />
          ))}
        </div>
      ) : null}
    </Section>
  );
}

export default function ArtifactDetailModal({ open, onClose, artifact }) {
  const row = artifact || null;
  const title = row ? `Buluntu Detay — ${row.full_artifact_no || row.id}` : "Buluntu Detay";

  return (
    <Modal open={open} title={title} onClose={onClose}>
      {!row ? (
        <div className="text-sm text-slate-600">Kayıt seçilmedi.</div>
      ) : (
        <>
          <Section title="Genel Bilgiler">
            <Row label="Tam Buluntu No" value={row.full_artifact_no} />
            <Row label="Anakod" value={row.main_code_code || row.main_code} />
            <Row label="Buluntu No" value={String(row.artifact_no ?? "").padStart(4, "0")} />
            <Row label="Buluntu Tarihi" value={row.artifact_date} />
            <Row label="Form" value={row.form_type} />
            <Row label="Yapım Malzemesi" value={row.production_material || ""} />
            <Row label="Dönem" value={row.period || ""} />
            <Row label="Eser Tarihi" value={row.piece_date || ""} />
            <Row label="Kaynak / Referans" value={row.source_and_reference || ""} />
            <Row label="Notlar" value={row.notes || ""} />
            <Row label="Envanterlik" value={row.is_inventory ? "Evet" : "Hayır"} />
            <Row label="Aktif" value={row.is_active ? "Evet" : "Hayır"} />
          </Section>

          <DetailsPretty row={row} />
          <MeasurementsPretty row={row} />

          {row.images?.length || row.drawings?.length ? (
            <Section title="Dosyalar">
              {row.images?.length ? <Row label="Fotoğraflar" value={row.images.join(", ")} /> : null}
              {row.drawings?.length ? <Row label="Çizimler" value={row.drawings.join(", ")} /> : null}
            </Section>
          ) : null}
        </>
      )}
    </Modal>
  );
}
