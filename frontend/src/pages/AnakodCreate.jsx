import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiGet, apiPatch, apiPost } from "../api.js";
import AlertModal from "../components/AlertModal.jsx";
import useAlertModal from "../hooks/useAlertModal.js";

import { Card, CardHeader, CardBody, CardTitle } from "../ui/Card.jsx";
import Button from "../ui/Button.jsx";
import Input from "../ui/Input.jsx";
import Select from "../ui/Select.jsx";
import Textarea from "../ui/Textarea.jsx";

export default function AnakodCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id");

  const { alert, showAlert, hideAlert } = useAlertModal();
  const [findingPlaceOptions, setFindingPlaceOptions] = useState([]);
  const [editingCode, setEditingCode] = useState("");

  const [form, setForm] = useState({
    finding_place: "",
    plan_square: "",
    description: "",
    layer: "",
    level: "",
    grave_no: "",
    gis: "",
  });

  useEffect(() => {
    apiGet("/api/lookups/?keys=FINDING_PLACE")
      .then((data) => setFindingPlaceOptions(data?.FINDING_PLACE ?? []))
      .catch((e) => showAlert({ type: "error", message: e.message || "Buluntu yeri listesi alınamadı." }));
  }, [showAlert]);

  useEffect(() => {
    if (!editId) {
      setEditingCode("");
      return;
    }
    apiGet(`/api/main-codes/${editId}/`)
      .then((data) => {
        setEditingCode(data.code || "");
        setForm({
          finding_place: data.finding_place ? String(data.finding_place) : "",
          plan_square: data.plan_square || "",
          description: data.description || "",
          layer: data.layer || "",
          level: data.level || "",
          grave_no: data.grave_no || "",
          gis: data.gis || "",
        });
      })
      .catch((e) => showAlert({ type: "error", message: e.message || "Anakod yüklenemedi." }));
  }, [editId, showAlert]);

  async function onSubmit(e) {
    e.preventDefault();
    hideAlert();

    if (!String(form.finding_place || "").trim()) {
      showAlert({ type: "error", message: "Buluntu Yeri zorunludur." });
      return;
    }

    try {
      if (editId) {
        await apiPatch(`/api/main-codes/${editId}/`, form);
        showAlert({ type: "success", message: "Anakod başarı ile güncellendi." });
      } else {
        const saved = await apiPost("/api/main-codes/", form);
        showAlert({ type: "success", message: `Anakod ${saved.code} başarı ile oluşturuldu.` });
        // Clear all but keep UX simple
        setForm({
          finding_place: "",
          plan_square: "",
          description: "",
          layer: "",
          level: "",
          grave_no: "",
          gis: "",
        });
      }
    } catch (e2) {
      showAlert({ type: "error", message: e2.message || "İşlem başarısız." });
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold">Anakod {editId ? "Güncelle" : "Oluştur"}</h1>
        <p className="mt-1 text-sm text-slate-600">
          {editId ? "Anakod bilgilerini güncelleyin." : "Kod sistem tarafından otomatik atanır (AAA → ZZZ)."}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Anakod Bilgileri</CardTitle>
        </CardHeader>
        <CardBody>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {editId ? (
                <div>
                  <label className="text-sm font-semibold text-slate-700">Anakod</label>
                  <div className="mt-1.5">
                    <Input value={editingCode} readOnly />
                  </div>
                </div>
              ) : null}
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
                    placeholder="Örn: A10"
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
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="primary" type="submit">
                {editId ? "Anakod Güncelle" : "Kaydet ve Kod Al"}
              </Button>
              {editId ? (
                <Button variant="secondary" type="button" onClick={() => navigate("/anakod/listele")}>
                  Listeye Dön
                </Button>
              ) : null}

            </div>
          </form>
        </CardBody>
      </Card>

      <AlertModal open={alert.open} type={alert.type} title={alert.title} message={alert.message} onClose={hideAlert} />
    </div>
  );
}
