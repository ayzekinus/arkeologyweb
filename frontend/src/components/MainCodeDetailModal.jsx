import React, { useEffect, useState } from "react";
import Modal from "./Modal.jsx";
import Row from "./KeyValueRow.jsx";
import Button from "../ui/Button.jsx";
import Pagination from "../ui/Pagination.jsx";
import { apiGet } from "../api.js";

function Panel({ title, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-2 font-extrabold">{title}</div>
      {children}
    </div>
  );
}

function buildQuery(params) {
  const qs = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v === null || v === undefined) return;
    const s = String(v).trim();
    if (!s) return;
    qs.set(k, s);
  });
  return qs.toString();
}

export default function MainCodeDetailModal({ open, onClose, mc, onOpenArtifact }) {
  const title = mc ? `Anakod Detay — ${mc.code}` : "Anakod Detay";

  const [loading, setLoading] = useState(false);
  const [artifacts, setArtifacts] = useState([]);
  const [count, setCount] = useState(0);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [ordering, setOrdering] = useState("-created_at");

  async function loadArtifacts(nextPage = page) {
    if (!mc?.id) return;
    setLoading(true);
    try {
      const q = buildQuery({
        main_code: mc.id,
        ordering,
        page: nextPage,
        page_size: pageSize,
      });
      const data = await apiGet(`/api/artifacts/?${q}`);
      const r = data.results || data;
      setArtifacts(r || []);
      setCount(data.count ?? (Array.isArray(r) ? r.length : 0));
    } catch {
      setArtifacts([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }

  // reset paging when mc changes or modal opens
  useEffect(() => {
    if (!open || !mc?.id) return;
    setPage(1);
    loadArtifacts(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mc?.id]);

  useEffect(() => {
    if (!open || !mc?.id) return;
    loadArtifacts(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, ordering]);

  return (
    <Modal open={open} title={title} onClose={onClose} width="min(1100px, 100%)">
      {!mc ? (
        <div className="text-sm text-slate-600">Kayıt seçilmedi.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Panel title="Anakod Bilgileri">
            <Row label="Anakod" value={mc.code} />
            <Row label="Buluntu Yeri" value={mc.finding_place} />
            <Row label="PlanKare" value={mc.plan_square || ""} />
            <Row label="Tabaka" value={mc.layer || ""} />
            <Row label="Seviye" value={mc.level || ""} />
            <Row label="Mezar No" value={mc.grave_no || ""} />
            <Row label="GIS" value={mc.gis || ""} />
            <Row label="Açıklama" value={mc.description || ""} />
          </Panel>

          <Panel title="Bağlı Buluntular">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm text-slate-600">
                Toplam: <span className="font-semibold text-slate-900">{count}</span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm"
                  value={ordering}
                  onChange={(e) => {
                    setOrdering(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="-created_at">Yeni → Eski</option>
                  <option value="created_at">Eski → Yeni</option>
                  <option value="-artifact_no">No: Büyük → Küçük</option>
                  <option value="artifact_no">No: Küçük → Büyük</option>
                </select>

                <select
                  className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm"
                  value={String(pageSize)}
                  onChange={(e) => {
                    setPageSize(parseInt(e.target.value, 10));
                    setPage(1);
                  }}
                >
                  <option value="10">10 / sayfa</option>
                  <option value="25">25 / sayfa</option>
                  <option value="50">50 / sayfa</option>
                  <option value="100">100 / sayfa</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="text-sm text-slate-600">Yükleniyor...</div>
            ) : (
              <div className="space-y-2">
                <div className="overflow-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                        <th className="border-b border-slate-200 px-2 py-2">Tam No</th>
                        <th className="border-b border-slate-200 px-2 py-2">Tarih</th>
                        <th className="border-b border-slate-200 px-2 py-2">Form</th>
                        <th className="border-b border-slate-200 px-2 py-2">Detay</th>
                      </tr>
                    </thead>
                    <tbody>
                      {artifacts.map((a) => (
                        <tr key={a.id} className="hover:bg-slate-50">
                          <td className="border-b border-slate-100 px-2 py-2 font-semibold">
                            {a.full_artifact_no}
                          </td>
                          <td className="border-b border-slate-100 px-2 py-2">{a.artifact_date}</td>
                          <td className="border-b border-slate-100 px-2 py-2">{a.form_type}</td>
                          <td className="border-b border-slate-100 px-2 py-2">
                            <Button
                              variant="secondary"
                              className="py-1.5"
                              onClick={() => onOpenArtifact && onOpenArtifact(a)}
                            >
                              Görüntüle
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {!artifacts.length ? (
                        <tr>
                          <td colSpan={4} className="px-2 py-5 text-center text-sm text-slate-600">
                            Kayıt yok.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>

                <Pagination
                  page={page}
                  pageSize={pageSize}
                  count={count}
                  onPageChange={(p) => setPage(Math.max(1, p))}
                />
              </div>
            )}
          </Panel>
        </div>
      )}
    </Modal>
  );
}
