import React from "react";
import { ENUMS, UNITS } from "../schemas/artifactSchemas.js";
import Input from "../ui/Input.jsx";
import Select from "../ui/Select.jsx";
import Textarea from "../ui/Textarea.jsx";

function Field({ label, children, hint, className = "" }) {
  return (
    <div className={className}>
      <label className="text-sm font-semibold text-slate-700">{label}</label>
      <div className="mt-1.5">{children}</div>
      {hint ? <div className="mt-1.5 text-xs text-slate-500">{hint}</div> : null}
    </div>
  );
}

function toEnumOptions(enumKey) {
  const map = ENUMS[enumKey] || {};
  const keys = Object.keys(map).sort((a, b) => Number(a) - Number(b));
  return keys.map((k) => ({ value: k, label: map[k] }));
}

function toUnitOptions(unitType) {
  const arr = UNITS[unitType] || [];
  return arr.map((u) => ({ value: u, label: u }));
}

export default function SchemaFields({ title, schema, data, onChange, gridCols = 2 }) {
  const items = schema || [];
  if (!items.length) return null;

  const colsClass =
    gridCols === 1 ? "grid-cols-1" : gridCols === 3 ? "grid-cols-3" : "grid-cols-2";

  return (
    <section className="mt-4 border-t border-slate-200 pt-3">
      <div className="mb-3 font-extrabold text-slate-900">{title}</div>

      <div className={`grid ${colsClass} gap-3`}>
        {items.map((f) => {
          const v = (data || {})[f.key];
          const u = f.unitKey ? (data || {})[f.unitKey] : "";

          const fullWidth = f.fullWidth ? "col-span-full" : "";

          if (f.kind === "textarea") {
            return (
              <Field key={f.key} label={f.label} className={fullWidth}>
                <Textarea value={v ?? ""} onChange={(e) => onChange(f.key, e.target.value)} rows={4} />
              </Field>
            );
          }

          if (f.kind === "enum") {
            const options = toEnumOptions(f.enumKey);
            return (
              <Field key={f.key} label={f.label} className={fullWidth}>
                <Select
                  value={v === null || v === undefined ? "" : String(v)}
                  onChange={(e) => onChange(f.key, e.target.value === "" ? null : Number(e.target.value))}
                >
                  <option value="">Seçiniz...</option>
                  {options.map((o) => (
                    <option key={String(o.value)} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </Field>
            );
          }

          if (f.kind === "measure" || f.unitKey) {
            const options = toUnitOptions(f.unitType || "length");
            return (
              <Field key={f.key} label={f.label} className={fullWidth}>
                <div className="grid grid-cols-[1fr_120px] gap-2.5">
                  <Input value={v ?? ""} onChange={(e) => onChange(f.key, e.target.value)} />
                  <Select value={u ?? ""} onChange={(e) => onChange(f.unitKey, e.target.value)}>
                    <option value="">Birim</option>
                    {options.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </Field>
            );
          }

          return (
            <Field key={f.key} label={f.label} className={fullWidth}>
              <Input value={v ?? ""} onChange={(e) => onChange(f.key, e.target.value)} />
            </Field>
          );
        })}
      </div>
    </section>
  );
}
