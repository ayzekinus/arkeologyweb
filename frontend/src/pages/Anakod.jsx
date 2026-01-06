import React, { useEffect, useState } from "react";
import { apiGet, apiPost, apiDelete } from "../api.js";

export default function Anakod() {
  const [rows, setRows] = useState([]);
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

  async function refresh() {
    setErr("");
    const data = await apiGet("/api/main-codes/");
    setRows(data.results || data);
  }

  useEffect(() => { refresh(); }, []);

  async function onCreate(e) {
    e.preventDefault();
    setMsg(""); setErr("");
    try {
      const created = await apiPost("/api/main-codes/", form);
      setMsg(`Anakod ${created.code} başarı ile oluşturuldu.`);
      setForm({ finding_place: "", plan_square: "", description: "", layer: "", level: "", grave_no: "", gis: "" });
      await refresh();
    } catch (e2) {
      setErr(e2.message);
    }
  }

  async function onDelete(id) {
    if (!confirm("Silmek istediğinize emin misiniz?")) return;
    setMsg(""); setErr("");
    try {
      await apiDelete(`/api/main-codes/${id}/`);
      setMsg("Kayıt silindi.");
      await refresh();
    } catch (e2) {
      setErr(e2.message);
    }
  }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Anakod</h1>

      <section style={{ padding: 16, border: "1px solid #e5e5e5", borderRadius: 12 }}>
        <h2 style={{ marginTop: 0, fontSize: 16 }}>Yeni Anakod Oluştur</h2>
        <form onSubmit={onCreate} style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
          <div>
            <label>Buluntu Yeri</label>
            <input required value={form.finding_place} onChange={(e) => setForm({ ...form, finding_place: e.target.value })} style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }} />
          </div>
          <div>
            <label>PlanKare</label>
            <input value={form.plan_square} onChange={(e) => setForm({ ...form, plan_square: e.target.value })} style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }} />
          </div>
          <div>
            <label>Tabaka</label>
            <input value={form.layer} onChange={(e) => setForm({ ...form, layer: e.target.value })} style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }} />
          </div>
          <div>
            <label>Seviye</label>
            <input value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }} />
          </div>
          <div>
            <label>Mezar No</label>
            <input value={form.grave_no} onChange={(e) => setForm({ ...form, grave_no: e.target.value })} style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }} />
          </div>
          <div>
            <label>GIS</label>
            <input value={form.gis} onChange={(e) => setForm({ ...form, gis: e.target.value })} style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label>Açıklama</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }} />
          </div>

          <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10, alignItems: "center" }}>
            <button type="submit" style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #ddd", background: "#f7f7f7", cursor: "pointer" }}>
              Anakod Oluştur (AAA..)
            </button>
            {msg && <span style={{ color: "#0b6" }}>{msg}</span>}
            {err && <span style={{ color: "#b00" }}>{err}</span>}
          </div>
        </form>
        <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
          Not: Anakod kodu sistem tarafından otomatik atanır ve sırayla ilerler (AAA → AAB → ...).
        </div>
      </section>

      <section style={{ marginTop: 18 }}>
        <h2 style={{ fontSize: 16 }}>Anakod Listesi</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Anakod", "Buluntu Yeri", "PlanKare", "Tabaka", "Seviye", "Mezar No", "İşlem"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee", fontSize: 13, color: "#444" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td style={{ padding: 10, borderBottom: "1px solid #f1f1f1", fontWeight: 700 }}>{r.code}</td>
                  <td style={{ padding: 10, borderBottom: "1px solid #f1f1f1" }}>{r.finding_place}</td>
                  <td style={{ padding: 10, borderBottom: "1px solid #f1f1f1" }}>{r.plan_square || ""}</td>
                  <td style={{ padding: 10, borderBottom: "1px solid #f1f1f1" }}>{r.layer || ""}</td>
                  <td style={{ padding: 10, borderBottom: "1px solid #f1f1f1" }}>{r.level || ""}</td>
                  <td style={{ padding: 10, borderBottom: "1px solid #f1f1f1" }}>{r.grave_no || ""}</td>
                  <td style={{ padding: 10, borderBottom: "1px solid #f1f1f1" }}>
                    <button onClick={() => onDelete(r.id)} style={{ padding: "6px 10px", borderRadius: 10, border: "1px solid #ddd", background: "#fff", cursor: "pointer" }}>
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr><td colSpan={7} style={{ padding: 12, color: "#666" }}>Henüz kayıt yok.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
