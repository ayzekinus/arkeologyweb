import React, { useState } from "react";
import { apiPost } from "../api.js";

import { Card, CardHeader, CardBody, CardTitle } from "../ui/Card.jsx";
import Button from "../ui/Button.jsx";
import Input from "../ui/Input.jsx";
import Textarea from "../ui/Textarea.jsx";

export default function AnakodCreate() {
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const [form, setForm] = useState({
    finding_place: "",
    plan_square: "",
    description: "",
    layer: "",
    level: "",
    grave_no: "",
    gis: "",
  });

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");
    setErr("");

    if (!String(form.finding_place || "").trim()) {
      setErr("Buluntu Yeri zorunludur.");
      return;
    }

    try {
      const saved = await apiPost("/api/main-codes/", form);
      setMsg(`Anakod ${saved.code} başarı ile oluşturuldu.`);
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
    } catch (e2) {
      setErr(e2.message || "İşlem başarısız.");
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold">Anakod Oluştur</h1>
        <p className="mt-1 text-sm text-slate-600">Kod sistem tarafından otomatik atanır (AAA → ZZZ).</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Anakod Bilgileri</CardTitle>
        </CardHeader>
        <CardBody>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-slate-700">Buluntu Yeri</label>
                <div className="mt-1.5">
                  <Input
                    required
                    value={form.finding_place}
                    onChange={(e) => setForm((p) => ({ ...p, finding_place: e.target.value }))}
                    placeholder="Örn: Açma / Sondaj / Alan..."
                  />
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
                Kaydet ve Kod Al
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
    </div>
  );
}
