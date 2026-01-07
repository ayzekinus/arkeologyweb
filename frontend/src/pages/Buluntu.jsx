import React, { useEffect, useMemo, useRef, useState } from "react";
import { apiGet, apiPost, apiDelete } from "../api.js";

function pad4(n) {
  const s = String(n ?? "").replace(/\D/g, "");
  if (!s) return "";
  return s.length >= 4 ? s : s.padStart(4, "0");
}

function Modal({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
        display: "grid", placeItems: "center", padding: 18, zIndex: 1000
      }}
    >
      <div style={{ width: "min(980px, 100%)", background: "#fff", borderRadius: 14, border: "1px solid #eee", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderBottom: "1px solid #eee" }}>
          <div style={{ fontWeight: 800 }}>{title}</div>
          <button onClick={onClose} style={{ padding: "6px 10px", borderRadius: 10, border: "1px solid #ddd", background: "#fff", cursor: "pointer" }}>
            Kapat
          </button>
        </div>
        <div style={{ padding: 14, maxHeight: "80vh", overflow: "auto" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 10, padding: "8px 0", borderBottom: "1px solid #f3f3f3" }}>
      <div style={{ color: "#555", fontSize: 13 }}>{label}</div>
      <div style={{ fontWeight: 600, whiteSpace: "pre-wrap" }}>{value || ""}</div>
    </div>
  );
}

export default function Buluntu() {
  const [anakod, setAnakod] = useState([]);
  const [rows, setRows] = useState([]);

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const [uniqueHint, setUniqueHint] = useState("");
  const [uniqueError, setUniqueError] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRow, setDetailRow] = useState(null);

  const debounceRef = useRef(null);

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
    images: [],
    drawings: [],
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

  const selectedCode = useMemo(
    () => anakod.find(a => String(a.id) === String(form.main_code)),
    [anakod, form.main_code]
  );

  const fullNoPreview = selectedCode ? `${selectedCode.code}${pad4(form.artifact_no)}` : "";

  async function checkUnique(nextMainCode, nextArtifactNo) {
    setUniqueHint("");
    setUniqueError(false);

    const mc = nextMainCode || form.main_code;
    const raw = nextArtifactNo ?? form.artifact_no;
    const padded = pad4(raw);
    if (!mc || !padded) {
      setUniqueHint("Ön kontrol için Anakod ve Buluntu No giriniz (örn: 0001).");
      return;
    }

    const noInt = parseInt(padded, 10);
    if (!noInt) return;

    try {
      const res = await apiGet(`/api/artifacts/check-unique/?main_code=${encodeURIComponent(mc)}&artifact_no=${encodeURIComponent(noInt)}`);
      if (res.exists) {
        setUniqueHint(`UYARI: Bu Anakod için bu Buluntu No zaten var (${fullNoPreview}).`);
        setUniqueError(true);
      } else {
        setUniqueHint(`Tam Buluntu No: ${fullNoPreview}`);
        setUniqueError(false);
      }
    } catch (e) {
      // sessiz geç; backend down vb.
      setUniqueHint(`Tam Buluntu No: ${fullNoPreview}`);
      setUniqueError(false);
    }
  }

  function scheduleUniqueCheck(nextMainCode, nextArtifactNo) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      checkUnique(nextMainCode, nextArtifactNo);
    }, 250);
  }

  useEffect(() => {
    scheduleUniqueCheck(form.main_code, form.artifact_no);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.main_code, form.artifact_no]);

  async function onCreate(e) {
    e.preventDefault();
    setMsg(""); setErr("");

    try {
      if (!form.main_code) throw new Error("Anakod seçiniz.");

      const padded = pad4(form.artifact_no);
      const no = parseInt(padded, 10);
      if (!no) throw new Error("Buluntu No giriniz (örn: 0001).");

      if (!form.artifact_date) throw new Error("Buluntu Tarihi seçiniz.");

      // Son kontrol: server-side unique endpoint (race condition'a da dayanır)
      const uniq = await apiGet(`/api/artifacts/check-unique/?main_code=${encodeURIComponent(form.main_code)}&artifact_no=${encodeURIComponent(no)}`);
      if (uniq.exists) throw new Error(`Bu Anakod için bu Buluntu No zaten mevcut (${fullNoPreview}).`);

      const payload = { ...form, artifact_no: no };
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
        images: [],
        drawings: [],
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

  function openDetail(r) {
    setDetailRow(r);
    setDetailOpen(true);
  }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Buluntu</h1>

      <section style={{ padding: 16, border: "1px solid #e5e5e5", borderRadius: 12 }}>
        <h2 style={{ marginTop: 0, fontSize: 16 }}>Buluntu Oluştur</h2>

        <form onSubmit={onCreate} style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
          <div>
            <label>Anakod</label>
            <select
              value={form.main_code}
              onChange={(e) => setForm({ ...form, main_code: e.target.value })}
              style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
            >
              <option value="">Seçiniz...</option>
              {anakod.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} — {a.finding_place}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Buluntu No</label>
            <input
              value={form.artifact_no}
              onChange={(e) => setForm({ ...form, artifact_no: e.target.value })}
              placeholder="0001"
              style={{ width: "100%", padding: 10, borderRadius: 10, border: uniqueError ? "1px solid #b00" : "1px solid #ddd" }}
            />
            <div style={{ fontSize: 12, color: uniqueError ? "#b00" : (fullNoPreview ? "#0b6" : "#666"), marginTop: 6 }}>
              {uniqueHint || (fullNoPreview ? `Tam Buluntu No: ${fullNoPreview}` : "Önizleme için Anakod seçiniz.")}
            </div>
          </div>

          <div>
            <label>Buluntu Tarihi</label>
            <input
              type="date"
              value={form.artifact_date}
              onChange={(e) => setForm({ ...form, artifact_date: e.target.value })}
              style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
            />
          </div>

          <div>
            <label>Form Türü</label>
            <select
              value={form.form_type}
              onChange={(e) => setForm({ ...form, form_type: e.target.value })}
              style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
            >
              <option value="GENEL">Genel</option>
              <option value="SIKKE">Sikke</option>
              <option value="SERAMIK">Seramik</option>
              <option value="MEZAR">Mezar</option>
            </select>
          </div>

          <div>
            <label>Yapım Malzemesi</label>
            <input
              value={form.production_material}
              onChange={(e) => setForm({ ...form, production_material: e.target.value })}
              style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
            />
          </div>

          <div>
            <label>Dönem</label>
            <input
              value={form.period}
              onChange={(e) => setForm({ ...form, period: e.target.value })}
              style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
            />
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              />
              Aktif
            </label>
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="checkbox"
                checked={form.is_inventory}
                onChange={(e) => setForm({ ...form, is_inventory: e.target.checked })}
              />
              Envanterlik
            </label>
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label>Notlar / Açıklama</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
            />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label>Kaynak / Referans</label>
            <textarea
              value={form.source_and_reference}
              onChange={(e) => setForm({ ...form, source_and_reference: e.target.value })}
              rows={3}
              style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
            />
          </div>

          <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10, alignItems: "center" }}>
            <button
              type="submit"
              disabled={uniqueError}
              style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #ddd", background: "#f7f7f7", cursor: uniqueError ? "not-allowed" : "pointer", opacity: uniqueError ? 0.6 : 1 }}
            >
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
                {["Tam No", "Anakod", "Buluntu No", "Buluntu Tarihi", "Form", "Malzeme", "Dönem", "Detay", "Sil"].map((h) => (
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
                    <button onClick={() => openDetail(r)} style={{ padding: "6px 10px", borderRadius: 10, border: "1px solid #ddd", background: "#fff", cursor: "pointer" }}>
                      Görüntüle
                    </button>
                  </td>

                  <td style={{ padding: 10, borderBottom: "1px solid #f1f1f1" }}>
                    <button onClick={() => onDelete(r.id)} style={{ padding: "6px 10px", borderRadius: 10, border: "1px solid #ddd", background: "#fff", cursor: "pointer" }}>
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr><td colSpan={9} style={{ padding: 12, color: "#666" }}>Henüz kayıt yok.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Modal
        open={detailOpen}
        title={detailRow ? `Buluntu Detay — ${detailRow.full_artifact_no}` : "Buluntu Detay"}
        onClose={() => { setDetailOpen(false); setDetailRow(null); }}
      >
        {detailRow ? (
          <div>
            <Row label="Tam Buluntu No" value={detailRow.full_artifact_no} />
            <Row label="Anakod" value={detailRow.main_code_code || String(detailRow.main_code)} />
            <Row label="Buluntu No" value={String(detailRow.artifact_no).padStart(4, "0")} />
            <Row label="Buluntu Tarihi" value={detailRow.artifact_date} />
            <Row label="Form Türü" value={detailRow.form_type} />
            <Row label="Yapım Malzemesi" value={detailRow.production_material} />
            <Row label="Dönem" value={detailRow.period} />
            <Row label="Notlar" value={detailRow.notes} />
            <Row label="Kaynak / Referans" value={detailRow.source_and_reference} />

            <div style={{ marginTop: 12, padding: 12, border: "1px solid #eee", borderRadius: 12 }}>
              <div style={{ fontWeight: 800, marginBottom: 8 }}>Form Detayları (JSON)</div>
              <pre style={{ margin: 0, fontSize: 12, background: "#fafafa", border: "1px solid #eee", borderRadius: 10, padding: 10 }}>
                {JSON.stringify(detailRow.details || {}, null, 2)}
              </pre>
            </div>

            <div style={{ marginTop: 12, padding: 12, border: "1px solid #eee", borderRadius: 12 }}>
              <div style={{ fontWeight: 800, marginBottom: 8 }}>Ölçü Bilgileri (JSON)</div>
              <pre style={{ margin: 0, fontSize: 12, background: "#fafafa", border: "1px solid #eee", borderRadius: 10, padding: 10 }}>
                {JSON.stringify(detailRow.measurements || {}, null, 2)}
              </pre>
            </div>

            <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ padding: 12, border: "1px solid #eee", borderRadius: 12 }}>
                <div style={{ fontWeight: 800, marginBottom: 6 }}>Görseller</div>
                <div style={{ color: "#666", fontSize: 13 }}>{(detailRow.images || []).length} adet</div>
              </div>
              <div style={{ padding: 12, border: "1px solid #eee", borderRadius: 12 }}>
                <div style={{ fontWeight: 800, marginBottom: 6 }}>Çizimler</div>
                <div style={{ color: "#666", fontSize: 13 }}>{(detailRow.drawings || []).length} adet</div>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
