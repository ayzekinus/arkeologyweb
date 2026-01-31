import React, { useCallback, useEffect, useState } from "react";
import { apiGet, apiPost, apiDelete } from "../api.js";
import AlertModal from "../components/AlertModal.jsx";
import MainCodeDetailModal from "../components/MainCodeDetailModal.jsx";
import ArtifactDetailModal from "../components/ArtifactDetailModal.jsx";
import useAlertModal from "../hooks/useAlertModal.js";

import { Card, CardHeader, CardBody, CardTitle } from "../ui/Card.jsx";
import Button from "../ui/Button.jsx";
import Input from "../ui/Input.jsx";
import Select from "../ui/Select.jsx";
import Textarea from "../ui/Textarea.jsx";
import { IconDelete, IconView } from "../ui/Icons.jsx";

export default function Anakod() {
  const [rows, setRows] = useState([]);
  const { alert, showAlert, hideAlert } = useAlertModal();

  const [mcDetailOpen, setMcDetailOpen] = useState(false);
  const [selectedMainCode, setSelectedMainCode] = useState(null);
  const [mcArtifacts, setMcArtifacts] = useState([]);
  const [mcArtifactsLoading, setMcArtifactsLoading] = useState(false);

  const [artifactDetailOpen, setArtifactDetailOpen] = useState(false);
  const [selectedArtifact, setSelectedArtifact] = useState(null);
  const [findingPlaceOptions, setFindingPlaceOptions] = useState([]);

  const [form, setForm] = useState({
    finding_place: "",
    plan_square: "",
    description: "",
    layer: "",
    level: "",
    grave_no: "",
    gis: "",
  });

  const refresh = useCallback(async () => {
    hideAlert();
    try {
      const data = await apiGet("/api/main-codes/");
      setRows(data.results || data);
    } catch (e) {
      showAlert({ type: "error", message: e.message || "Liste yüklenemedi." });
    }
  }, [hideAlert, showAlert]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    apiGet("/api/lookups/?keys=FINDING_PLACE")
      .then((data) => setFindingPlaceOptions(data?.FINDING_PLACE ?? []))
      .catch((e) => showAlert({ type: "error", message: e.message || "Buluntu yeri listesi alınamadı." }));
  }, [showAlert]);

  async function onCreate(e) {
    e.preventDefault();
    hideAlert();
    try {
      const res = await apiPost("/api/main-codes/", form);
      // Anakod alanı temizlenmesin → sistem verir (backend)
      setForm((p) => ({ ...p, description: "" })); // örnek: açıklamayı temizle
      await refresh();
      showAlert({ type: "success", message: `${res.code} anakod başarı ile oluşturuldu.` });
    } catch (e2) {
      showAlert({ type: "error", message: e2.message || "İşlem başarısız." });
    }
  }

  async function onDelete(id) {
    if (!confirm("Silmek istediğinize emin misiniz?")) return;
    hideAlert();
    try {
      await apiDelete(`/api/main-codes/${id}/`);
      await refresh();
      showAlert({ type: "success", message: "Kayıt silindi." });
    } catch (e2) {
      showAlert({ type: "error", message: e2.message || "Silme başarısız." });
    }
  }

  async function openMainCodeDetail(row) {
    setSelectedMainCode(row);
    setMcDetailOpen(true);
    setMcArtifacts([]);
    setMcArtifactsLoading(true);
    hideAlert();
    try {
      const data = await apiGet(`/api/artifacts/?main_code=${encodeURIComponent(row.id)}`);
      setMcArtifacts(data.results || data);
    } catch (e) {
      showAlert({ type: "error", message: e.message || "Buluntular yüklenemedi." });
    } finally {
      setMcArtifactsLoading(false);
    }
  }

  function openArtifactDetail(artifact) {
    setSelectedArtifact(artifact);
    setArtifactDetailOpen(true);
    setMcDetailOpen(false);
    setSelectedMainCode(null);
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
                <Select
                  required
                  value={form.finding_place}
                  onChange={(e) => setForm((p) => ({ ...p, finding_place: e.target.value }))}
                >
                  <option value="">Seçiniz...</option>
                  {findingPlaceOptions.map((item) => (
                    <option key={String(item.id)} value={String(item.id)}>
                      {item.label}
                    </option>
                  ))}
                </Select>
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

            </div>
          </form>
        </CardBody>
      </Card>

      <AlertModal open={alert.open} type={alert.type} title={alert.title} message={alert.message} onClose={hideAlert} />

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
                    <td className="border-b border-slate-100 px-2 py-2">{r.finding_place_label || ""}</td>
                    <td className="border-b border-slate-100 px-2 py-2">{r.plan_square || ""}</td>
                    <td className="border-b border-slate-100 px-2 py-2">{r.layer || ""}</td>
                    <td className="border-b border-slate-100 px-2 py-2">{r.level || ""}</td>
                    <td className="border-b border-slate-100 px-2 py-2">{r.grave_no || ""}</td>
                    <td className="border-b border-slate-100 px-2 py-2">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => openMainCodeDetail(r)}
                          className="py-1.5"
                          aria-label="Görüntüle"
                          title="Görüntüle"
                        >
                          <IconView />
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => onDelete(r.id)}
                          className="py-1.5"
                          aria-label="Sil"
                          title="Sil"
                        >
                          <IconDelete />
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
