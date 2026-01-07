import React, { useEffect, useMemo, useRef, useState } from "react";
import { apiGet, apiPost, apiDelete } from "../api.js";

const LENGTH_UNITS = ["mm", "cm", "m"];
const WEIGHT_UNITS = ["gr", "kg"];

const SURFACE_QUALITY = [
  { value: 0, label: "Pürtüklü" },
  { value: 1, label: "Tozsu" },
  { value: 2, label: "Kaygan" },
];

const BAKING = [
  { value: 0, label: "İyi" },
  { value: 1, label: "Orta" },
  { value: 2, label: "Kötü" },
];

const TEXTURE = [
  { value: 0, label: "Sert" },
  { value: 1, label: "Orta" },
  { value: 2, label: "Yumuşak" },
];

const PORE = [
  { value: 0, label: "Az" },
  { value: 1, label: "Orta" },
  { value: 2, label: "Çok" },
];

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

function Field({ label, children, hint }) {
  return (
    <div>
      <label>{label}</label>
      <div style={{ marginTop: 6 }}>{children}</div>
      {hint ? <div style={{ marginTop: 6, fontSize: 12, color: "#666" }}>{hint}</div> : null}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, error }) {
  return (
    <input
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ width: "100%", padding: 10, borderRadius: 10, border: error ? "1px solid #b00" : "1px solid #ddd" }}
    />
  );
}

function Select({ value, onChange, options, placeholder }) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
    >
      <option value="">{placeholder || "Seçiniz..."}</option>
      {options.map((o) => (
        <option key={String(o.value)} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function TwoPartMeasure({ label, value, unit, onChangeValue, onChangeUnit }) {
  return (
    <Field label={label}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: 10 }}>
        <TextInput value={value} onChange={onChangeValue} placeholder="" />
        <Select
          value={unit}
          onChange={onChangeUnit}
          options={LENGTH_UNITS.map((u) => ({ value: u, label: u }))}
          placeholder="Birim"
        />
      </div>
    </Field>
  );
}

function getOptionLabel(options, value) {
  const v = value === null || value === undefined ? "" : String(value);
  const found = options.find((o) => String(o.value) === v);
  return found ? found.label : String(value ?? "");
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

  function setDetail(key, value) {
    setForm((prev) => ({
      ...prev,
      details: { ...(prev.details || {}), [key]: value },
    }));
  }

  function setMeasure(key, value) {
    setForm((prev) => ({
      ...prev,
      measurements: { ...(prev.measurements || {}), [key]: value },
    }));
  }

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
      // DRF router: trailing slash önemli
      const res = await apiGet(`/api/artifacts/check-unique/?main_code=${encodeURIComponent(mc)}&artifact_no=${encodeURIComponent(noInt)}`);
      if (res.exists) {
        setUniqueHint(`UYARI: Bu Anakod için bu Buluntu No zaten var (${fullNoPreview}).`);
        setUniqueError(true);
      } else {
        setUniqueHint(`Tam Buluntu No: ${fullNoPreview}`);
        setUniqueError(false);
      }
    } catch (e) {
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

      // Server-side unique check (endpoint yoksa da kayıt devam edebilsin; asıl güvence unique_together)
      try {
        const uniq = await apiGet(`/api/artifacts/check-unique/?main_code=${encodeURIComponent(form.main_code)}&artifact_no=${encodeURIComponent(no)}`);
        if (uniq.exists) throw new Error(`Bu Anakod için bu Buluntu No zaten mevcut (${fullNoPreview}).`);
      } catch (e) {
        // check-unique endpoint 404/500 vb. durumlarda kayıt sürecini bloklamayalım.
        // Backend tarafındaki unique_together + serializer validasyonu yine çakışmayı engeller.
      }

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

  function renderFormFields() {
    if (form.form_type === "SIKKE") {
      return (
        <section style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid #eee" }}>
          <div style={{ fontWeight: 800, marginBottom: 10 }}>Sikke Alanları</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
            <Field label="Kondüsyon">
              <TextInput value={form.details?.condition} onChange={(v) => setDetail("condition", v)} />
            </Field>

            <Field label="Birimi">
              <TextInput value={form.details?.unit} onChange={(v) => setDetail("unit", v)} />
            </Field>

            <Field label="Çap">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: 10 }}>
                <TextInput value={form.details?.diameter} onChange={(v) => setDetail("diameter", v)} />
                <Select value={form.details?.diameter_unit} onChange={(v) => setDetail("diameter_unit", v)} options={LENGTH_UNITS.map(u => ({ value: u, label: u }))} placeholder="Birim" />
              </div>
            </Field>

            <Field label="Kalıp Yönü">
              <TextInput value={form.details?.mold_direction} onChange={(v) => setDetail("mold_direction", v)} />
            </Field>

            <Field label="İmparator">
              <TextInput value={form.details?.emperor} onChange={(v) => setDetail("emperor", v)} />
            </Field>

            <Field label="Darp Yılı">
              <TextInput value={form.details?.minting_year} onChange={(v) => setDetail("minting_year", v)} />
            </Field>

            <Field label="Ön Yüz Tanımı">
              <TextInput value={form.details?.front_face_definition} onChange={(v) => setDetail("front_face_definition", v)} />
            </Field>

            <Field label="Arka Yüz Tanımı">
              <TextInput value={form.details?.back_face_definition} onChange={(v) => setDetail("back_face_definition", v)} />
            </Field>

            <Field label="Ön Yüz Lejandı">
              <TextInput value={form.details?.front_face_legend} onChange={(v) => setDetail("front_face_legend", v)} />
            </Field>

            <Field label="Arka Yüz Lejandı">
              <TextInput value={form.details?.back_face_legend} onChange={(v) => setDetail("back_face_legend", v)} />
            </Field>

            <Field label="Darphane">
              <TextInput value={form.details?.mint} onChange={(v) => setDetail("mint", v)} />
            </Field>

            <Field label="Şube">
              <TextInput value={form.details?.branch} onChange={(v) => setDetail("branch", v)} />
            </Field>

            <Field label="Ref.">
              <TextInput value={form.details?.reference} onChange={(v) => setDetail("reference", v)} />
            </Field>

            <Field label="Ağırlık">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: 10 }}>
                <TextInput value={form.details?.weight} onChange={(v) => setDetail("weight", v)} />
                <Select value={form.details?.weight_unit} onChange={(v) => setDetail("weight_unit", v)} options={WEIGHT_UNITS.map(u => ({ value: u, label: u }))} placeholder="Birim" />
              </div>
            </Field>
          </div>
        </section>
      );
    }

    if (form.form_type === "SERAMIK") {
      return (
        <section style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid #eee" }}>
          <div style={{ fontWeight: 800, marginBottom: 10 }}>Seramik Alanları</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
            <Field label="Hamur Rengi">
              <TextInput value={form.details?.clay_color} onChange={(v) => setDetail("clay_color", v)} placeholder="örn: Kırmızımsı" />
            </Field>
            <Field label="Astar Rengi">
              <TextInput value={form.details?.undercoat_color} onChange={(v) => setDetail("undercoat_color", v)} placeholder="örn: Krem" />
            </Field>
            <Field label="Dipinto Rengi">
              <TextInput value={form.details?.dipinto_color} onChange={(v) => setDetail("dipinto_color", v)} />
            </Field>
            <Field label="Diğer Renk">
              <TextInput value={form.details?.other_color} onChange={(v) => setDetail("other_color", v)} />
            </Field>
            <Field label="Yüzey Rengi">
              <TextInput value={form.details?.surface_color} onChange={(v) => setDetail("surface_color", v)} />
            </Field>
            <Field label="Sır Rengi">
              <TextInput value={form.details?.glaze_color} onChange={(v) => setDetail("glaze_color", v)} />
            </Field>
            <Field label="Bezeme Rengi">
              <TextInput value={form.details?.pattern_color} onChange={(v) => setDetail("pattern_color", v)} />
            </Field>

            <Field label="Hamur Tanım">
              <TextInput value={form.details?.clay_definition} onChange={(v) => setDetail("clay_definition", v)} />
            </Field>
            <Field label="Form Tanım">
              <TextInput value={form.details?.form_definition} onChange={(v) => setDetail("form_definition", v)} />
            </Field>

            <Field label="Astar/Sır/Yüzey Tanım">
              <TextInput value={form.details?.more_definition} onChange={(v) => setDetail("more_definition", v)} />
            </Field>

            <Field label="Yüzey Kalitesi">
              <Select value={form.details?.surface_quality} onChange={(v) => setDetail("surface_quality", v === "" ? "" : Number(v))} options={SURFACE_QUALITY} />
            </Field>

            <Field label="Fırınlama">
              <Select value={form.details?.baking} onChange={(v) => setDetail("baking", v === "" ? "" : Number(v))} options={BAKING} />
            </Field>

            <Field label="Doku">
              <Select value={form.details?.texture} onChange={(v) => setDetail("texture", v === "" ? "" : Number(v))} options={TEXTURE} />
            </Field>

            <Field label="Gözenek">
              <Select value={form.details?.pore} onChange={(v) => setDetail("pore", v === "" ? "" : Number(v))} options={PORE} />
            </Field>
          </div>
        </section>
      );
    }

    return null;
  }

  function renderMeasurements() {
    // Ortak ölçüler (örnek set). İleride DB şemasına bağlayacağız.
    return (
      <section style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid #eee" }}>
        <div style={{ fontWeight: 800, marginBottom: 10 }}>Ölçü Bilgileri</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
          <TwoPartMeasure
            label="Yükseklik"
            value={form.measurements?.height}
            unit={form.measurements?.height_unit}
            onChangeValue={(v) => setMeasure("height", v)}
            onChangeUnit={(v) => setMeasure("height_unit", v)}
          />
          <TwoPartMeasure
            label="Ağız Çapı"
            value={form.measurements?.nozzle_diameter}
            unit={form.measurements?.nozzle_diameter_unit}
            onChangeValue={(v) => setMeasure("nozzle_diameter", v)}
            onChangeUnit={(v) => setMeasure("nozzle_diameter_unit", v)}
          />
          <TwoPartMeasure
            label="Kaide/Dip Çapı"
            value={form.measurements?.base_diameter}
            unit={form.measurements?.base_diameter_unit}
            onChangeValue={(v) => setMeasure("base_diameter", v)}
            onChangeUnit={(v) => setMeasure("base_diameter_unit", v)}
          />
          <TwoPartMeasure
            label="Kalınlık/Cidar"
            value={form.measurements?.wall_thickness}
            unit={form.measurements?.wall_thickness_unit}
            onChangeValue={(v) => setMeasure("wall_thickness", v)}
            onChangeUnit={(v) => setMeasure("wall_thickness_unit", v)}
          />
          <TwoPartMeasure
            label="Uzunluk"
            value={form.measurements?.length}
            unit={form.measurements?.length_unit}
            onChangeValue={(v) => setMeasure("length", v)}
            onChangeUnit={(v) => setMeasure("length_unit", v)}
          />
          <TwoPartMeasure
            label="Genişlik"
            value={form.measurements?.width}
            unit={form.measurements?.width_unit}
            onChangeValue={(v) => setMeasure("width", v)}
            onChangeUnit={(v) => setMeasure("width_unit", v)}
          />
          <TwoPartMeasure
            label="Gövde Çapı"
            value={form.measurements?.body_diameter}
            unit={form.measurements?.body_diameter_unit}
            onChangeValue={(v) => setMeasure("body_diameter", v)}
            onChangeUnit={(v) => setMeasure("body_diameter_unit", v)}
          />
        </div>
      </section>
    );
  }

  function renderDetailsPretty(row) {
    // details JSON'u "form_type"a göre daha okunur gösterir (bu sürümde basit)
    const d = row.details || {};
    const m = row.measurements || {};

    if (row.form_type === "SIKKE") {
      return (
        <div style={{ marginTop: 12, padding: 12, border: "1px solid #eee", borderRadius: 12 }}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>Sikke Detayları</div>
          <Row label="Kondüsyon" value={d.condition} />
          <Row label="Birimi" value={d.unit} />
          <Row label="Çap" value={[d.diameter, d.diameter_unit].filter(Boolean).join(" ")} />
          <Row label="Kalıp Yönü" value={d.mold_direction} />
          <Row label="İmparator" value={d.emperor} />
          <Row label="Darp Yılı" value={d.minting_year} />
          <Row label="Ön Yüz Tanımı" value={d.front_face_definition} />
          <Row label="Arka Yüz Tanımı" value={d.back_face_definition} />
          <Row label="Ön Yüz Lejandı" value={d.front_face_legend} />
          <Row label="Arka Yüz Lejandı" value={d.back_face_legend} />
          <Row label="Darphane" value={d.mint} />
          <Row label="Şube" value={d.branch} />
          <Row label="Ref." value={d.reference} />
          <Row label="Ağırlık" value={[d.weight, d.weight_unit].filter(Boolean).join(" ")} />
        </div>
      );
    }

    if (row.form_type === "SERAMIK") {
      return (
        <div style={{ marginTop: 12, padding: 12, border: "1px solid #eee", borderRadius: 12 }}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>Seramik Detayları</div>
          <Row label="Hamur Rengi" value={d.clay_color} />
          <Row label="Astar Rengi" value={d.undercoat_color} />
          <Row label="Dipinto Rengi" value={d.dipinto_color} />
          <Row label="Yüzey Rengi" value={d.surface_color} />
          <Row label="Sır Rengi" value={d.glaze_color} />
          <Row label="Bezeme Rengi" value={d.pattern_color} />
          <Row label="Diğer Renk" value={d.other_color} />
          <Row label="Hamur Tanım" value={d.clay_definition} />
          <Row label="Form Tanım" value={d.form_definition} />
          <Row label="Astar/Sır/Yüzey Tanım" value={d.more_definition} />
          <Row label="Yüzey Kalitesi" value={getOptionLabel(SURFACE_QUALITY, d.surface_quality)} />
          <Row label="Fırınlama" value={getOptionLabel(BAKING, d.baking)} />
          <Row label="Doku" value={getOptionLabel(TEXTURE, d.texture)} />
          <Row label="Gözenek" value={getOptionLabel(PORE, d.pore)} />
        </div>
      );
    }

    // Default: show raw JSON for now
    return (
      <div style={{ marginTop: 12, padding: 12, border: "1px solid #eee", borderRadius: 12 }}>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>Form Detayları (JSON)</div>
        <pre style={{ margin: 0, fontSize: 12, background: "#fafafa", border: "1px solid #eee", borderRadius: 10, padding: 10 }}>
          {JSON.stringify(d, null, 2)}
        </pre>
      </div>
    );
  }

  function renderMeasurementsPretty(row) {
    const m = row.measurements || {};
    return (
      <div style={{ marginTop: 12, padding: 12, border: "1px solid #eee", borderRadius: 12 }}>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>Ölçü Bilgileri</div>
        <Row label="Yükseklik" value={[m.height, m.height_unit].filter(Boolean).join(" ")} />
        <Row label="Ağız Çapı" value={[m.nozzle_diameter, m.nozzle_diameter_unit].filter(Boolean).join(" ")} />
        <Row label="Kaide/Dip Çapı" value={[m.base_diameter, m.base_diameter_unit].filter(Boolean).join(" ")} />
        <Row label="Kalınlık/Cidar" value={[m.wall_thickness, m.wall_thickness_unit].filter(Boolean).join(" ")} />
        <Row label="Uzunluk" value={[m.length, m.length_unit].filter(Boolean).join(" ")} />
        <Row label="Genişlik" value={[m.width, m.width_unit].filter(Boolean).join(" ")} />
        <Row label="Gövde Çapı" value={[m.body_diameter, m.body_diameter_unit].filter(Boolean).join(" ")} />
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Buluntu</h1>

      <section style={{ padding: 16, border: "1px solid #e5e5e5", borderRadius: 12 }}>
        <h2 style={{ marginTop: 0, fontSize: 16 }}>Buluntu Oluştur</h2>

        <form onSubmit={onCreate} style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
          <Field label="Anakod">
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
          </Field>

          <Field label="Buluntu No" hint={uniqueHint || (fullNoPreview ? `Tam Buluntu No: ${fullNoPreview}` : "Önizleme için Anakod seçiniz.")}>
            <TextInput
              value={form.artifact_no}
              onChange={(v) => setForm({ ...form, artifact_no: v })}
              placeholder="0001"
              error={uniqueError}
            />
          </Field>

          <Field label="Buluntu Tarihi">
            <input
              type="date"
              value={form.artifact_date}
              onChange={(e) => setForm({ ...form, artifact_date: e.target.value })}
              style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
            />
          </Field>

          <Field label="Form Türü" hint="Not: Form değiştirince form detayları sıfırlanır (karışmasın diye).">
            <select
              value={form.form_type}
              onChange={(e) => setForm({ ...form, form_type: e.target.value, details: {}, measurements: {} })}
              style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
            >
              <option value="GENEL">Genel</option>
              <option value="SIKKE">Sikke</option>
              <option value="SERAMIK">Seramik</option>
              <option value="MEZAR">Mezar</option>
            </select>
          </Field>

          <Field label="Yapım Malzemesi">
            <TextInput value={form.production_material} onChange={(v) => setForm({ ...form, production_material: v })} />
          </Field>

          <Field label="Dönem">
            <TextInput value={form.period} onChange={(v) => setForm({ ...form, period: v })} />
          </Field>

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

          <div style={{ gridColumn: "1 / -1" }}>
            {renderFormFields()}
            {renderMeasurements()}
          </div>

          <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10, alignItems: "center", marginTop: 6 }}>
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

            {renderDetailsPretty(detailRow)}
            {renderMeasurementsPretty(detailRow)}

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
