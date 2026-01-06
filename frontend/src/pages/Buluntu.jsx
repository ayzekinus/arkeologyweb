import React, { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost, apiDelete } from "../api.js";

function pad4(n) {
  const s = String(n ?? "").replace(/\D/g, "");
  if (!s) return "";
  return s.length >= 4 ? s : s.padStart(4, "0");
}

export default function Buluntu() {
  const [anakod, setAnakod] = useState([]);
  const [rows, setRows] = useState([]);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const [form, setForm] = useState({
    main_code: "",
    artifact_no: "",
    artifact_date: "",
    form_type: "GENEL",
    production_material: "",
    period: "",
    is_inventory: false,
    is_active: true,
    notes: "",
    source_and_reference: "",
    details: {},
    measurements: {},
  });

  async function refresh() {
    setErr("");
    const [codes, arts] = await Promise.all([
      apiGet("/api/main-codes/"),
      apiGet("/api/artifacts/"),
    ]);
    setAnakod((codes.results || codes) ?? []);
    setRows((arts.results || arts) ?? []);
  }

  useEffect(() => { refresh(); }, []);

  const selectedCode = useMemo(() => anakod.find(a => String(a.id) === String(form.main_code)), [anakod, form.main_code]);
  const fullNoPreview = selectedCode ? `${selectedCode.code}${pad4(form.artifact_no)}` : "";

  async function onCreate(e) {
    e.preventDefault();
    setMsg(""); setErr("");
    try {
      if (!form.main_code) throw new Error("Anakod seçiniz.");
      const no = parseInt(pad4(form.artifact_no), 10);
      if (!no) throw new Error("Buluntu No giriniz (örn: 0001).");
      if (!form.artifact_date) throw new Error("Buluntu Tarihi seçiniz.");

      const payload = {
        ...form,
        artifact_no: no,
      };
      const created = await apiPost("/api/artifacts/", payload);
      setMsg(`${created.full_artifact_no} başarı ile kayıt edildi.`);
      setForm({
        main_code: "",
        artifact_no: "",
        artifact_date: "",
        form_type: "GENEL",
        production_material: "",
        period: "",
        is_inventory: false,
        is_active: true,
        notes: "",
        source_and_reference: "",
        details: {},
        measurements: {},
      });
      await refresh();
    } catch (e2) {
      setErr(e2.message);
    }
  }

  async function onDelete(id) {
    if (!confirm("Silmek istediğinize emin misiniz?")) return;
    setMsg(""); setErr("");
    try {
      await apiDelete(`/api/artifacts/${id}/`);
      setMsg("Kayıt silindi.");
      await refresh();
    } catch (e2) {
      setErr(e2.message);
    }
  }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Buluntu</h1>

      <section style={{ padding: 16, border: "1px solid #e5e5e5", borderRadius: 12 }}>
        <h2 style={{ marginTop: 0, fontSize: 16 }}>Buluntu Oluştur</h2>

        <form onSubmit={onCreate} style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
          <div>
            <label>Anakod</label>
            <select value={form.main_code} onChange={(e) => setForm({ ...form, main_code: e.target.value })} style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }}>
              <option value="">Seçiniz...</option>
              {anakod.map((a) => <option key={a.id} value={a.id}>{a.code} — {a.finding_place}</option>)}
            </select>
          </div>

          <div>
            <label>Buluntu No</label>
            <input value={form.artifact_no} onChange={(e) => setForm({ ...form, artifact_no: e.target.value })} placeholder="0001" style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }} />
            <div style={{ fontSize: 12, color: fullNoPreview ? "#0b6" : "#666", marginTop: 6 }}>
              {fullNoPreview ? `Tam Buluntu No: ${fullNoPreview}` : "Önizleme için Anakod seçiniz."}
            </div>
          </div>

          <div>
            <label>Buluntu Tarihi</label>
            <input type="date" value={form.artifact_date} onChange={(e) => setForm({ ...form, artifact_date: e.target.value })} style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }} />
          </div>

          <div>
            <label>Form Türü</label>
            <select value={form.form_type} onChange={(e) => setForm({ ...form, form_type: e.target.value })} style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }}>
              <option value="GENEL">Genel</option>
              <option value="SIKKE">Sikke</option>
              <option value="SERAMIK">Seramik</option>
              <option value="MEZAR">Mezar</option>
            </select>
          </div>

          <div>
            <label>Yapım Malzemesi</label>
            <input value={form.production_material} onChange={(e) => setForm({ ...form, production_material: e.target.value })} style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }} />
          </div>

          <div>
            <label>Dönem</label>
            <input value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }} />
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
              Aktif
            </label>
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="checkbox" checked={form.is_inventory} onChange={(e) => setForm({ ...form, is_inventory: e.target.checked })} />
              Envanterlik
            </label>
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label>Notlar / Açıklama</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }} />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label>Kaynak / Referans</label>
            <textarea value={form.source_and_reference} onChange={(e) => setForm({ ...form, source_and_reference: e.target.value })} rows={3} style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }} />
          </div>

          <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10, alignItems: "center" }}>
            <button type="submit" style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #ddd", background: "#f7f7f7", cursor: "pointer" }}>
              Buluntu Kaydet
            </button>
            {msg && <span style={{ color: "#0b6" }}>{msg}</span>}
            {err && <span style={{ color: "#b00" }}>{err}</span>}
          </div>
        </form>
      </section>

      <section style={{ marginTop: 18 }}>
        <h2 style={{ fontSize: 16 }}>Buluntu Listesi</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Tam No", "Anakod", "Buluntu No", "Buluntu Tarihi", "Form", "Malzeme", "Dönem", "İşlem"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee", fontSize: 13, color: "#444" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td style={{ padding: 10, borderBottom: "1px solid #f1f1f1", fontWeight: 700 }}>{r.full_artifact_no}</td>
                  <td style={{ padding: 10, borderBottom: "1px solid #f1f1f1" }}>{r.main_code_code || r.main_code}</td>
                  <td style={{ padding: 10, borderBottom: "1px solid #f1f1f1" }}>{String(r.artifact_no).padStart(4, "0")}</td>
                  <td style={{ padding: 10, borderBottom: "1px solid #f1f1f1" }}>{r.artifact_date}</td>
                  <td style={{ padding: 10, borderBottom: "1px solid #f1f1f1" }}>{r.form_type}</td>
                  <td style={{ padding: 10, borderBottom: "1px solid #f1f1f1" }}>{r.production_material || ""}</td>
                  <td style={{ padding: 10, borderBottom: "1px solid #f1f1f1" }}>{r.period || ""}</td>
                  <td style={{ padding: 10, borderBottom: "1px solid #f1f1f1" }}>
                    <button onClick={() => onDelete(r.id)} style={{ padding: "6px 10px", borderRadius: 10, border: "1px solid #ddd", background: "#fff", cursor: "pointer" }}>
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr><td colSpan={8} style={{ padding: 12, color: "#666" }}>Henüz kayıt yok.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
          Not: Bu sayfa şu an temel CRUD iskeletidir. Sonraki adımda: Anakod’a bağlı Buluntu Yeri kilitleme, detay modal, dinamik form alanları, export vb. ekleyeceğiz.
        </div>
      </section>
    </div>
  );
}
