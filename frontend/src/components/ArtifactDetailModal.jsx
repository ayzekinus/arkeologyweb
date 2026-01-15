import { useEffect, useMemo, useState } from "react";

/**
 * ArtifactDetailModal
 * - Used in Buluntu Listele: "Görüntüle" action opens this modal.
 * - Fetches artifact detail from backend when opened.
 * - Fixes runtime crash: ReferenceError: detail is not defined
 */
export default function ArtifactDetailModal({
  isOpen,
  onClose,
  artifactId,
  artifact,
}) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!isOpen || !artifactId) {
        setDetail(null);
        setErr(null);
        return;
      }

      setLoading(true);
      setErr(null);

      try {
        const resp = await fetch(`/api/artifacts/${artifactId}/`, {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "include",
        });

        if (!resp.ok) {
          const t = await resp.text();
          throw new Error(`${resp.status} ${resp.statusText} - ${t}`);
        }

        const data = await resp.json();
        if (!cancelled) setDetail(data);
      } catch (e) {
        if (!cancelled) setErr(e?.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [isOpen, artifactId]);

  // Prefer freshly fetched detail, fallback to list item (artifact prop)
  const shown = useMemo(() => detail ?? artifact ?? null, [detail, artifact]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-5xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="text-base font-semibold text-slate-900">Buluntu Detay</div>
          <button
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
            onClick={onClose}
            type="button"
          >
            Kapat
          </button>
        </div>

        <div className="px-6 py-5">
          {loading && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              Yükleniyor...
            </div>
          )}

          {err && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {err}
            </div>
          )}

          {!loading && !err && !shown && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              Detay bulunamadı.
            </div>
          )}

          {!loading && !err && shown && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-xs text-slate-500">Anakod</div>
                <div className="text-sm font-semibold text-slate-900">
                  {shown?.main_code_code ??
                    shown?.main_code_display ??
                    shown?.main_code ??
                    "-"}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-xs text-slate-500">Buluntu No</div>
                <div className="text-sm font-semibold text-slate-900">
                  {shown?.artifact_no ?? "-"}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-xs text-slate-500">Buluntu Tarihi</div>
                <div className="text-sm font-semibold text-slate-900">
                  {shown?.artifact_date ?? "-"}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-xs text-slate-500">Form Türü</div>
                <div className="text-sm font-semibold text-slate-900">
                  {shown?.form_type_title ?? shown?.form_type ?? "-"}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:col-span-2">
                <div className="text-xs text-slate-500">Notlar / Açıklama</div>
                <div className="whitespace-pre-wrap text-sm text-slate-900">
                  {shown?.notes ?? "-"}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-6 py-4">
          <button
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            onClick={onClose}
            type="button"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
