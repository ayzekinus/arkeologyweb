import React, { useEffect, useMemo, useState } from "react";
import { apiGet } from "../api.js";
import AlertModal from "./AlertModal.jsx";
import Modal from "./Modal.jsx";
import KeyValueRow from "./KeyValueRow.jsx";

function hasValue(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return true;
}

function formatValue(value) {
  if (!hasValue(value)) return "-";
  if (typeof value === "boolean") return value ? "Evet" : "Hayır";
  if (Array.isArray(value)) return value.map((item) => formatValue(item)).join(", ");
  if (typeof value === "object") {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return "[Object]";
    }
  }
  return String(value);
}

export default function ConservationDetailModal({ open, onClose, conservation }) {
  const [detail, setDetail] = useState(conservation || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldMeta, setFieldMeta] = useState({});

  const conservationId = useMemo(() => {
    return conservation?.id ?? conservation?.pk ?? null;
  }, [conservation]);

  useEffect(() => {
    if (!open) return;
    if (conservation) setDetail(conservation);
  }, [open, conservation]);

  useEffect(() => {
    if (!open || !conservationId) return;
    if (detail && detail.data !== undefined) return;
    setLoading(true);
    setError("");
    apiGet(`/api/conservations/${conservationId}/`)
      .then((data) => setDetail(data))
      .catch((e) => setError(e.message || "Detaylar yüklenemedi."))
      .finally(() => setLoading(false));
  }, [open, conservationId, detail]);

  useEffect(() => {
    if (!open || !detail) return;
    const formKeys = Array.isArray(detail.form_keys) ? detail.form_keys.filter(Boolean) : [];
    if (!formKeys.length) {
      setFieldMeta({});
      return;
    }

    let active = true;
    Promise.all(
      formKeys.map((key) => apiGet(`/api/forms/${encodeURIComponent(key)}/schema/`))
    )
      .then((schemas) => {
        if (!active) return;
        const map = {};
        schemas.forEach((schema) => {
          (schema?.sections || []).forEach((section) => {
            (section?.fields || []).forEach((field) => {
              if (field?.key && field?.label) {
                const choices = Array.isArray(field.choices) ? field.choices : [];
                map[field.key] = { label: field.label, choices };
              }
            });
          });
        });
        setFieldMeta(map);
      })
      .catch(() => {
        if (!active) return;
        setFieldMeta({});
      });

    return () => {
      active = false;
    };
  }, [open, detail]);

  const dataEntries = useMemo(() => {
    if (!detail?.data || typeof detail.data !== "object") return [];
    return Object.entries(detail.data);
  }, [detail]);

  function formatValueWithMeta(key, value) {
    const meta = fieldMeta[key];
    if (!meta) return formatValue(value);

    const formatChoice = (val) => {
      if (val && typeof val === "object") {
        if (val.label) return String(val.label);
        if (val.value !== undefined) return String(val.value);
      }
      const found = meta.choices?.find((choice) => choice?.value === val);
      return found?.label ?? formatValue(val);
    };

    if (Array.isArray(value)) {
      return value.map((item) => formatChoice(item)).join(", ");
    }

    return formatChoice(value);
  }

  const imageEntries = useMemo(() => {
    if (!detail?.images || !Array.isArray(detail.images)) return [];
    return detail.images;
  }, [detail]);

  return (
    <>
      <Modal open={open} onClose={onClose} title="Konservasyon Detayı">
        {loading ? <div className="text-sm text-slate-600">Yükleniyor...</div> : null}
        {detail ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <KeyValueRow label="Buluntu No" value={formatValue(detail.artifact_full_no)} />
              <KeyValueRow label="Malzeme" value={formatValue(detail.material)} />
              <KeyValueRow label="Konservatör" value={formatValue(detail.conservator)} />
              <KeyValueRow label="Form Anahtarları" value={formatValue(detail.form_keys)} />
              <KeyValueRow label="Oluşturma Tarihi" value={formatValue(detail.created_at)} />
              <KeyValueRow label="Güncelleme Tarihi" value={formatValue(detail.updated_at)} />
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-700">Konservasyon Alanları</div>
              {dataEntries.length === 0 ? (
                <div className="mt-2 text-sm text-slate-500">Konservasyon alanı bulunmuyor.</div>
              ) : (
                <div className="mt-2 space-y-1">
                  {dataEntries.map(([key, value]) => (
                    <KeyValueRow
                      key={key}
                      label={fieldMeta[key]?.label || key}
                      value={formatValueWithMeta(key, value)}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-700">Görseller</div>
              {imageEntries.length === 0 ? (
                <div className="mt-2 text-sm text-slate-500">Görsel bulunmuyor.</div>
              ) : (
                <div className="mt-2 space-y-1">
                  {imageEntries.map((img, index) => (
                    <KeyValueRow key={`${img?.url || index}`} label={`Görsel ${index + 1}`} value={formatValue(img)} />
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </Modal>

      <AlertModal
        open={Boolean(error)}
        type="error"
        message={error}
        onClose={() => setError("")}
      />
    </>
  );
}
