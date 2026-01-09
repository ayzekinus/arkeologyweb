import React, { useEffect, useState } from "react";
import { apiGet, apiPost, apiDelete } from "../api.js";
import MainCodeDetailModal from "../components/MainCodeDetailModal.jsx";
import ArtifactDetailModal from "../components/ArtifactDetailModal.jsx";

import { Card, CardHeader, CardBody, CardTitle } from "../ui/Card.jsx";
import Button from "../ui/Button.jsx";
import Input from "../ui/Input.jsx";
import Textarea from "../ui/Textarea.jsx";

export default function Anakod() {
  const [rows, setRows] = useState([]);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const [mcDetailOpen, setMcDetailOpen] = useState(false);
  const [selectedMainCode, setSelectedMainCode] = useState(null);
  const [mcArtifacts, setMcArtifacts] = useState([]);
  const [mcArtifactsLoading, setMcArtifactsLoading] = useState(false);

  const [artifactDetailOpen, setArtifactDetailOpen] = useState(false);
  const [selectedArtifact, setSelectedArtifact] = useState(null);

  const [form, setForm] = useState({
    finding_place: "",
    plan_square: "",
    description: "",
    layer: "",
    level: "",
    grave_no: "",
    gis: "",
  });

  async function refresh() {
    setErr("");
    try {
      const data = await apiGet("/api/main-codes/");
      setRows(data.results || data);
    } catch (e) {
      setErr(e.message || "Liste yüklenemedi.");
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function onCreate(e) {
    e.preventDefault();
    setMsg("");
    setErr("");
    try {
      const res = await apiPost("/api/main-codes/", form);
      setMsg(`${res.code} anakod başarı ile oluşturuldu.`);
      // Anakod alanı temizlenmesin → sistem verir (backend)
      setForm((p) => ({ ...p, description: "" })); // örnek: açıklamayı temizle
      await refresh();
    } catch (e2) {
      setErr(e2.message || "İşlem başarısız.");
    }
  }

  async function onDelete(id) {
    if (!confirm("Silmek istediğinize emin misiniz?")) return;
    setMsg("");
    setErr("");
    try {
      await apiDelete(`/api/main-codes/${id}/`);
      setMsg("Kayıt silindi.");
      await refresh();
    } catch (e2) {
      setErr(e2.message || "Silme başarısız.");
    }
  }

  async function openMainCodeDetail(row) {
    setSelectedMainCode(row);
    setMcDetailOpen(true);
    setMcArtifacts([]);
    setMcArtifactsLoading(true);
    setErr("");
    try {
      const data = await apiGet(`/api/artifacts/?main_code=${encodeURIComponent(row.id)}`);
      setMcArtifacts(data.results || data);
    } catch (e) {
      setErr(e.message || "Buluntular yüklenemedi.");
    } finally {
      setMcArtifactsLoading(false);
    }
  }

  function openArtifactDetail(artifact) {
    setSelectedArtifact(artifact);
    setArtifactDetailOpen(true);
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold">Anakod</h1>
        <p className="mt-1 text-sm text-slate-600">
          Anakod kodu sistem tarafından otomatik atanır ve sırayla ilerler (AAA → AAB → ...).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Anakod Oluştur</CardTitle>
        </CardHeader>
        <CardBody>
          <form onSubmit={onCreate} className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-slate-700">Buluntu Yeri</label>
              <div className="mt-1.5">
                <Input
                  required
                  value={form.finding_place}
                  onChange={(e) => setForm((p) => ({ ...p, finding_place: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">PlanKare</label>
              <div className="mt-1.5">
                <Input
                  value={form.plan_square}
                  onChange={(e) => setForm((p) => ({ ...p, plan_square: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">Tabaka</label>
              <div className="mt-1.5">
                <Input value={form.layer} onChange={(e) => setForm((p) => ({ ...p, layer: e.target.value }))} />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">Seviye</label>
              <div className="mt-1.5">
                <Input value={form.level} onChange={(e) => setForm((p) => ({ ...p, level: e.target.value }))} />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">Mezar No</label>
              <div className="mt-1.5">
                <Input value={form.grave_no} onChange={(e) => setForm((p) => ({ ...p, grave_no: e.target.value }))} />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">GIS</label>
              <div className="mt-1.5">
                <Input value={form.gis} onChange={(e) => setForm((p) => ({ ...p, gis: e.target.value }))} />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-slate-700">Açıklama</label>
              <div className="mt-1.5">
                <Textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                />
              </div>
            </div>

            <div className="md:col-span-2 flex flex-wrap items-center gap-2">
              <Button variant="primary" type="submit">
                Anakod Oluştur
              </Button>

              {msg ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                  {msg}
                </div>
              ) : null}

              {err ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {err}
                </div>
              ) : null}
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Anakod Listesi</CardTitle>
          <Button variant="secondary" onClick={refresh}>
            Yenile
          </Button>
        </CardHeader>
        <CardBody>
          <div className="overflow-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  {["Anakod", "Buluntu Yeri", "PlanKare", "Tabaka", "Seviye", "Mezar No", "Detay"].map((h) => (
                    <th key={h} className="border-b border-slate-200 px-2 py-2">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="border-b border-slate-100 px-2 py-2 font-semibold">{r.code}</td>
                    <td className="border-b border-slate-100 px-2 py-2">{r.finding_place}</td>
                    <td className="border-b border-slate-100 px-2 py-2">{r.plan_square || ""}</td>
                    <td className="border-b border-slate-100 px-2 py-2">{r.layer || ""}</td>
                    <td className="border-b border-slate-100 px-2 py-2">{r.level || ""}</td>
                    <td className="border-b border-slate-100 px-2 py-2">{r.grave_no || ""}</td>
                    <td className="border-b border-slate-100 px-2 py-2">
                      <div className="flex flex-wrap gap-2">
                        <Button variant="secondary" onClick={() => openMainCodeDetail(r)} className="py-1.5">
                          Görüntüle
                        </Button>
                        <Button variant="danger" onClick={() => onDelete(r.id)} className="py-1.5">
                          Sil
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!rows.length ? (
                  <tr>
                    <td colSpan={7} className="px-2 py-6 text-center text-sm text-slate-600">
                      Kayıt yok.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      <MainCodeDetailModal
        open={mcDetailOpen}
        onClose={() => {
          setMcDetailOpen(false);
          setSelectedMainCode(null);
        }}
        mainCode={selectedMainCode}
        artifacts={mcArtifacts}
        loading={mcArtifactsLoading}
        onOpenArtifact={openArtifactDetail}
      />

      <ArtifactDetailModal
        open={artifactDetailOpen}
        onClose={() => {
          setArtifactDetailOpen(false);
          setSelectedArtifact(null);
        }}
        artifact={selectedArtifact}
      />
    </div>
  );
}
