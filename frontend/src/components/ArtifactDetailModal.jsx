import React, { useEffect, useMemo, useState } from "react";

/**
 * ArtifactDetailModal (backward-compatible)
 *
 * This project has gone through multiple iterations, so list pages may pass
 * different prop names.
 *
 * Supported:
 * - open OR isOpen
 * - artifactId OR id OR pk OR artifact (object)
 * - onClose (optional)
 */
export default function ArtifactDetailModal({
  open,
  isOpen,
  artifactId: artifactIdProp,
  id,
  pk,
  artifact,
  onClose,
}) {
  const visible = Boolean(open ?? isOpen);

  const artifactId = useMemo(() => {
    return (
      artifactIdProp ??
      id ??
      pk ??
      (artifact && (artifact.id ?? artifact.pk)) ??
      null
    );
  }, [artifactIdProp, id, pk, artifact]);

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [visible, onClose]);

  useEffect(() => {
    if (!visible) return;

    // If list passes the whole artifact object, show it immediately.
    if (artifact && typeof artifact === "object") {
      setDetail(artifact);
    }

    if (!artifactId) {
      setError("Buluntu ID bulunamadı.");
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/artifacts/${artifactId}/`, {
          credentials: "include",
          headers: { Accept: "application/json" },
        });
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`API Hatası (${res.status}): ${txt}`);
        }
        const data = await res.json();
        if (!cancelled) setDetail(data);
      } catch (e) {
        if (!cancelled) setError(e?.message || "Detay yüklenemedi.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [visible, artifactId, artifact]);

  if (!visible) return null;

  const mainCodeLabel =
    detail?.main_code_code ??
    detail?.main_code_display ??
    detail?.main_code ??
    "-";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      {/* Overlay */}
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/40"
        onClick={() => onClose?.()}
      />

      {/* Modal */}
      <div className="relative mx-4 w-full max-w-4xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <div className="text-sm font-semibold text-slate-900">Buluntu Detayı</div>
            <div className="text-xs text-slate-500">ID: {artifactId ?? "-"}</div>
          </div>
          <button
            type="button"
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            onClick={() => onClose?.()}
          >
            Kapat
          </button>
        </div>

        <div className="max-h-[75vh] overflow-auto p-5">
          {loading && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              Yükleniyor...
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
              {error}
            </div>
          )}

          {!loading && !error && (
            <>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-xs text-slate-500">Anakod</div>
                  <div className="text-sm font-semibold text-slate-900">{mainCodeLabel}</div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-xs text-slate-500">Buluntu No</div>
                  <div className="text-sm font-semibold text-slate-900">
                    {detail?.artifact_no ?? detail?.artifactNo ?? "-"}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-xs text-slate-500">Buluntu Tarihi</div>
                  <div className="text-sm font-semibold text-slate-900">
                    {detail?.artifact_date ?? detail?.artifactDate ?? "-"}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-xs text-slate-500">Form Türü</div>
                  <div className="text-sm font-semibold text-slate-900">
                    {detail?.form_type_title ?? detail?.form_type ?? detail?.formType ?? "-"}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-xs text-slate-500">Eser Tarihi</div>
                  <div className="text-sm font-semibold text-slate-900">
                    {detail?.piece_date ?? detail?.pieceDate ?? "-"}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-xs text-slate-500">Envanterlik</div>
                  <div className="text-sm font-semibold text-slate-900">
                    {detail?.is_inventory ?? detail?.isInventory
                      ? "Evet"
                      : "Hayır"}
                  </div>
                </div>
              </div>

              {/* Raw JSON fallback (useful until FormBuilder-detail rendering is finalized) */}
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 text-xs font-semibold text-slate-700">Ham Veri</div>
                <pre className="whitespace-pre-wrap break-words text-xs text-slate-700">
                  {JSON.stringify(detail ?? {}, null, 2)}
                </pre>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
