import React, { useMemo } from "react";
import { ENUMS, UNITS } from "../schemas/artifactSchemas.js";
import Input from "../ui/Input.jsx";
import Select from "../ui/Select.jsx";
import Textarea from "../ui/Textarea.jsx";

function Field({ label, required = false, hint, className = "", children }) {
  return (
    <div className={className}>
      <div className="mb-1 flex items-center gap-2">
        <div className="text-sm font-medium text-slate-800">
          {label}
          {required ? <span className="ml-1 text-red-600">*</span> : null}
        </div>
      </div>
      {children}
      {hint ? <div className="mt-1 text-xs text-slate-500">{hint}</div> : null}
    </div>
  );
}

function normalizeOptions(options) {
  if (!Array.isArray(options)) return [];
  // Accept both {value,label} objects and simple strings
  return options
    .map((o) => {
      if (o == null) return null;
      if (typeof o === "string" || typeof o === "number") return { value: o, label: String(o) };
      if (typeof o === "object") return { value: o.value, label: o.label ?? String(o.value) };
      return null;
    })
    .filter(Boolean);
}

export default function SchemaFields({ title, schema = [], data = {}, onChange }) {
  const safeData = data || {};

  const derived = useMemo(() => {
    return (schema || []).map((f) => {
      const options = normalizeOptions(f.options || (f.enumKey ? ENUMS[f.enumKey] : null));
      return { ...f, _options: options };
    });
  }, [schema]);

  function set(key, value) {
    onChange && onChange(key, value);
  }

  function renderField(f) {
    const value = safeData?.[f.key] ?? "";

    const commonProps = {
      disabled: !!f.readonly,
      required: !!f.required,
    };

    // TEXTAREA
    if (f.kind === "textarea") {
      return (
        <Field
          key={f.key}
          label={f.label}
          required={f.required}
          hint={f.helpText}
          className={f.fullWidth ? "md:col-span-2" : ""}
        >
          <Textarea
            value={value}
            onChange={(e) => set(f.key, e.target.value)}
            {...commonProps}
          />
        </Field>
      );
    }

    // BOOLEAN
    if (f.kind === "bool") {
      const checked = !!safeData?.[f.key];
      return (
        <Field
          key={f.key}
          label={f.label}
          required={f.required}
          hint={f.helpText}
          className={f.fullWidth ? "md:col-span-2" : ""}
        >
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => set(f.key, e.target.checked)}
              disabled={commonProps.disabled}
            />
            <span className="text-sm text-slate-700">{checked ? "Evet" : "Hayır"}</span>
          </label>
        </Field>
      );
    }

    // DATE
    if (f.kind === "date") {
      return (
        <Field
          key={f.key}
          label={f.label}
          required={f.required}
          hint={f.helpText}
          className={f.fullWidth ? "md:col-span-2" : ""}
        >
          <Input
            type="date"
            value={value || ""}
            onChange={(e) => set(f.key, e.target.value)}
            {...commonProps}
          />
        </Field>
      );
    }

    // MULTISELECT
    if (f.kind === "multiselect") {
      const options = f._options || [];
      const arr = Array.isArray(value) ? value : [];
      return (
        <Field
          key={f.key}
          label={f.label}
          required={f.required}
          hint={f.helpText}
          className={f.fullWidth ? "md:col-span-2" : ""}
        >
          <select
            multiple
            className="w-full rounded-xl border border-slate-200 bg-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            value={arr.map(String)}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
              set(f.key, selected);
            }}
            disabled={commonProps.disabled}
          >
            {options.map((o) => (
              <option key={String(o.value)} value={String(o.value)}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
      );
    }

    // ENUM / SELECT
    if (f.kind === "enum") {
      const options = f._options || [];
      // If options not provided, fall back to plain input
      if (!options.length) {
        return (
          <Field
            key={f.key}
            label={f.label}
            required={f.required}
            hint={f.helpText}
            className={f.fullWidth ? "md:col-span-2" : ""}
          >
            <Input
              type={f.inputType || "text"}
              value={value}
              onChange={(e) => set(f.key, e.target.value)}
              {...commonProps}
            />
          </Field>
        );
      }

      return (
        <Field
          key={f.key}
          label={f.label}
          required={f.required}
          hint={f.helpText}
          className={f.fullWidth ? "md:col-span-2" : ""}
        >
          <Select
            value={value ?? ""}
            onChange={(e) => set(f.key, e.target.value)}
            {...commonProps}
          >
            <option value="">Seçiniz</option>
            {options.map((o) => (
              <option key={String(o.value)} value={String(o.value)}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
      );
    }

    // MEASURE (value + unit)
    if (f.kind === "measure" || f.unitKey) {
      const unitKey = f.unitKey || `${f.key}_unit`;
      const unitType = (f.unitType || "length").trim();

      const rawUnits =
        Array.isArray(f.unitOptions) && f.unitOptions.length
          ? f.unitOptions
          : UNITS[unitType] || UNITS.length || [];

      const units = (rawUnits || [])
        .map((u) => {
          if (typeof u === "string") return { value: u, label: u };
          const value = u?.value ?? u?.id ?? u?.key;
          const label = u?.label ?? u?.name ?? value;
          return value ? { value, label } : null;
        })
        .filter(Boolean);

      const unitVal = safeData?.[unitKey] ?? units?.[0]?.value ?? "";

      return (
        <Field
          key={f.key}
          label={f.label}
          required={f.required}
          hint={f.helpText}
          className={f.fullWidth ? "md:col-span-2" : ""}
        >
          <div className="grid grid-cols-3 gap-2">
            <Input
              className="col-span-2"
              type={f.inputType || "text"}
              value={value}
              onChange={(e) => set(f.key, e.target.value)}
              {...commonProps}
            />
            <Select
              value={unitVal}
              onChange={(e) => set(unitKey, e.target.value)}
              disabled={commonProps.disabled}
            >
              {units.map((u) => (
                <option key={String(u.value)} value={String(u.value)}>
                  {u.label}
                </option>
              ))}
            </Select>
          </div>
        </Field>
      );
    }

    // DEFAULT INPUT
    return (
      <Field
        key={f.key}
        label={f.label}
        required={f.required}
        hint={f.helpText}
        className={f.fullWidth ? "md:col-span-2" : ""}
      >
        <Input
          type={f.inputType || "text"}
          value={value}
          onChange={(e) => set(f.key, e.target.value)}
          {...commonProps}
        />
      </Field>
    );
  }

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {derived.map(renderField)}
      </div>
    </div>
  );
}
