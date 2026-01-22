import React, { useEffect, useMemo, useState } from "react";

function coalesce(...values) {
  for (const v of values) {
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return null;
}

function hasValue(v) {
  if (v === undefined || v === null) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") return Object.keys(v).length > 0;
  return true;
}

function formatValue(v) {
  if (!hasValue(v)) return "-";
  if (typeof v === "boolean") return v ? "Evet" : "Hayır";

  if (Array.isArray(v)) {
    const parts = v
      .map((x) => formatValue(x))
      .map((s) => (s === "-" ? "" : s))
      .filter(Boolean);
    return parts.length ? parts.join(", ") : "-";
  }

  if (typeof v === "object") {
    const preferred = coalesce(
      v.label,
      v.name,
      v.title,
      v.display,
      v.value,
      v.key,
      v.code,
      v.id
    );
    if (preferred !== null) return String(preferred);

    try {
      return JSON.stringify(v);
    } catch {
      return "[Object]";
    }
  }

  return String(v);
}

function formatMeasure(rawValue, rawUnit) {
  if (!hasValue(rawValue)) return "-";
  const val = formatValue(rawValue);
  const unit = hasValue(rawUnit) ? formatValue(rawUnit) : "";
  return unit ? `${val} ${unit}` : val;
}

function InfoCard({ label, value, wide = false }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${
        wide ? "sm:col-span-2" : ""
      }`}
    >
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 whitespace-pre-wrap break-words text-sm font-semibold text-slate-900">
        {value}
      </div>
    </div>
  );
}

export default function ArtifactDetailModal({
  open,
  isOpen,
  artifactId,
  id,
  pk,
  artifact,
  onClose,
}) {
  const visible = open !== undefined ? open : Boolean(isOpen);

  const resolvedId = useMemo(() => {
    return (
      artifactId ??
      id ??
      pk ??
      artifact?.id ??
      artifact?.pk ??
      artifact?.artifact_id ??
      null
    );
  }, [artifactId, id, pk, artifact]);

  const [detail, setDetail] = useState(artifact ?? null);
  const [schema, setSchema] = useState(null);
  const [loading, setLoading] = useState(false);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!visible) return;
    if (artifact) setDetail(artifact);
  }, [visible, artifact]);

  // Fetch full detail if needed
  useEffect(() => {
    if (!visible) return;
    if (!resolvedId) return;

    const needsFetch =
      !detail ||
      (detail.details === undefined &&
        detail.measurements === undefined &&
        detail.form_type !== undefined);

    if (!needsFetch) return;

    setLoading(true);
    setError(null);

    fetch(`/api/artifacts/${resolvedId}/`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => setDetail(data))
      .catch((e) => {
        setError(String(e?.message || e));
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, resolvedId]);

  const formKey = useMemo(() => {
    if (!detail) return null;

    const ft = detail.form_type;
    if (typeof ft === "string") return ft;

    if (ft && typeof ft === "object") {
      return (
        ft.key ??
        ft.code ??
        ft.value ??
        ft.name ??
        ft.title ??
        null
      );
    }

    return detail.form_type_key ?? detail.form_key ?? null;
  }, [detail]);

  // Fetch schema for the selected form
  useEffect(() => {
    if (!visible) return;
    if (!formKey) {
      setSchema(null);
      return;
    }

    setSchemaLoading(true);
    fetch(`/api/forms/${encodeURIComponent(formKey)}/schema/`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => setSchema(data))
      .catch(() => setSchema(null))
      .finally(() => setSchemaLoading(false));
  }, [visible, formKey]);

  const displayMainCode = useMemo(() => {
    if (!detail) return "-";
    const v = coalesce(
      detail.main_code_code,
      detail.main_code_display,
      detail.main_code_title,
      detail.main_code?.code,
      detail.main_code?.title,
      detail.main_code?.name,
      detail.main_code
    );
    return v !== null ? String(v) : "-";
  }, [detail]);

  const summary = useMemo(() => {
    if (!detail) return [];

    const artifactNo = coalesce(
      detail.full_artifact_no,
      detail.artifact_no,
      detail.buluntu_no
    );

    const artifactDate = coalesce(detail.artifact_date, detail.buluntu_tarihi);

    const formTitle = coalesce(
      detail.form_type_title,
      detail.form_type_display,
      detail.form_title,
      (typeof detail.form_type === "object" ? detail.form_type?.title : null),
      formKey
    );

    const mainCodeFindingPlace = coalesce(
      detail.main_code_finding_place,
      detail.main_code?.finding_place_label,
      detail.main_code?.finding_place
    );
    const mainCodePlanSquare = coalesce(
      detail.main_code_plan_square,
      detail.main_code?.plan_square
    );
    const mainCodeDescription = coalesce(
      detail.main_code_description,
      detail.main_code?.description
    );
    const mainCodeLayer = coalesce(detail.main_code_layer, detail.main_code?.layer);
    const mainCodeLevel = coalesce(detail.main_code_level, detail.main_code?.level);
    const mainCodeGraveNo = coalesce(detail.main_code_grave_no, detail.main_code?.grave_no);
    const mainCodeGis = coalesce(detail.main_code_gis, detail.main_code?.gis);

    const pieceDate = coalesce(detail.piece_date, detail.eser_tarihi);

    const isInventory =
      detail.is_inventory !== undefined ? detail.is_inventory : detail.envanterlik;

    return [
      { label: "Anakod", value: displayMainCode, key: "main_code" },
      {
        label: "Buluntu Yeri (Anakod)",
        value: hasValue(mainCodeFindingPlace) ? String(mainCodeFindingPlace) : "-",
        key: "main_code_finding_place",
      },
      {
        label: "PlanKare (Anakod)",
        value: hasValue(mainCodePlanSquare) ? String(mainCodePlanSquare) : "-",
        key: "main_code_plan_square",
      },
      {
        label: "Açıklama (Anakod)",
        value: hasValue(mainCodeDescription) ? String(mainCodeDescription) : "-",
        key: "main_code_description",
      },
      {
        label: "Tabaka (Anakod)",
        value: hasValue(mainCodeLayer) ? String(mainCodeLayer) : "-",
        key: "main_code_layer",
      },
      {
        label: "Seviye (Anakod)",
        value: hasValue(mainCodeLevel) ? String(mainCodeLevel) : "-",
        key: "main_code_level",
      },
      {
        label: "Mezar No (Anakod)",
        value: hasValue(mainCodeGraveNo) ? String(mainCodeGraveNo) : "-",
        key: "main_code_grave_no",
      },
      {
        label: "GIS (Anakod)",
        value: hasValue(mainCodeGis) ? String(mainCodeGis) : "-",
        key: "main_code_gis",
      },
      {
        label: "Buluntu No",
        value: hasValue(artifactNo) ? String(artifactNo) : "-",
        key: "artifact_no",
      },
      {
        label: "Buluntu Tarihi",
        value: hasValue(artifactDate) ? String(artifactDate) : "-",
        key: "artifact_date",
      },
      {
        label: "Form Türü",
        value: hasValue(formTitle) ? String(formTitle) : "-",
        key: "form_type",
      },
      {
        label: "Eser Tarihi",
        value: hasValue(pieceDate) ? String(pieceDate) : "-",
        key: "piece_date",
      },
      {
        label: "Envanterlik",
        value:
          isInventory === true
            ? "Evet"
            : isInventory === false
            ? "Hayır"
            : "-",
        key: "is_inventory",
      },
    ];
  }, [detail, displayMainCode, formKey]);

  const summaryKeySet = useMemo(() => {
    const s = new Set();
    summary.forEach((x) => s.add(x.key));
    return s;
  }, [summary]);

  function getFieldDisplay(field) {
    if (!detail) return { display: "-", raw: null };

    const key = field.key;
    const bucket = field.bucket;

    if (key === "main_code") return { display: displayMainCode, raw: displayMainCode };

    if (bucket === "details") {
      const raw = coalesce(detail.details?.[key], detail.form_details?.[key]);
      return { display: formatValue(raw), raw };
    }

    if (bucket === "measurements") {
      const rawValue = coalesce(detail.measurements?.[key], detail[key]);
      const rawUnit = coalesce(
        detail.measurements?.[`${key}_unit`],
        detail.measurements?.[`${key}Unit`],
        detail[`${key}_unit`]
      );
      return { display: formatMeasure(rawValue, rawUnit), raw: rawValue };
    }

    // general
    const raw = coalesce(detail[key], detail.general?.[key]);
    return { display: formatValue(raw), raw };
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3">
      <div className="w-full max-w-5xl rounded-2xl bg-slate-50 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <div className="text-sm text-slate-500">Buluntu Detayı</div>
            <div className="text-lg font-semibold text-slate-900">
              {hasValue(detail?.full_artifact_no)
                ? String(detail.full_artifact_no)
                : hasValue(detail?.artifact_no)
                ? `#${detail.artifact_no}`
                : resolvedId
                ? `#${resolvedId}`
                : ""}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Kapat
          </button>
        </div>

        <div className="max-h-[80vh] overflow-auto px-6 py-5">
          {(loading || schemaLoading) && (
            <div className="mb-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
              Yükleniyor...
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {summary.map((c) => (
              <InfoCard key={c.key} label={c.label} value={c.value} />
            ))}
          </div>

          <div className="mt-6 space-y-7">
            {schema?.sections?.length ? (
              schema.sections.map((section) => {
                const visibleFields = (section.fields || [])
                  .filter((f) => !summaryKeySet.has(f.key))
                  .map((f) => ({ field: f, v: getFieldDisplay(f) }))
                  // Show only non-empty fields to avoid huge empty forms
                  .filter(({ v }) => hasValue(v.raw));

                if (!visibleFields.length) return null;

                return (
                  <div key={section.key || section.title}>
                    <div className="mb-3 text-sm font-semibold text-slate-900">
                      {section.title}
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {visibleFields.map(({ field, v }) => (
                        <InfoCard
                          key={`${field.bucket}:${field.key}`}
                          label={field.label}
                          value={v.display}
                          wide={field.data_type === "textarea"}
                        />
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                Form şeması bulunamadı. (FormBuilder tanımı yapılmadıysa bu normaldir.)
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
