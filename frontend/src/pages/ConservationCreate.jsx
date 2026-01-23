import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet } from "../api.js";
import { Card, CardHeader, CardBody, CardTitle } from "../ui/Card.jsx";
import Button from "../ui/Button.jsx";
import Input from "../ui/Input.jsx";

const MATERIAL_FORM_FIELDS = {
  // örnek: cam için alanlar ileride burada tanımlanabilir
  // cam: [{ key: "surface_state", label: "Yüzey Durumu" }],
};

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

export default function ConservationCreate() {
  const navigate = useNavigate();
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedArtifact, setSelectedArtifact] = useState(null);
  const [formData, setFormData] = useState({});

  const [searchFilters, setSearchFilters] = useState({
    q: "",
    main_code_code: "",
    finding_place: "",
    artifact_no: "",
  });

  const materialKey = useMemo(
    () => String(selectedArtifact?.production_material || "").trim().toLowerCase(),
    [selectedArtifact]
  );
  const materialFields = MATERIAL_FORM_FIELDS[materialKey] || [];

  async function onSearchArtifacts() {
    setSearchError("");
    setSearchResults([]);
    const hasFilter = Object.values(searchFilters).some((v) => String(v || "").trim());
    if (!hasFilter) {
      setSearchError("Lütfen arama kriteri giriniz.");
      return;
    }
    try {
      setSearchLoading(true);
      const q = buildQuery({ ...searchFilters, page_size: 20, ordering: "-created_at" });
      const data = await apiGet(`/api/artifacts/?${q}`);
      setSearchResults(data.results || data || []);
    } catch (e) {
      setSearchError(e.message || "Buluntu araması başarısız.");
    } finally {
      setSearchLoading(false);
    }
  }

  function onSelectArtifact(item) {
    setSelectedArtifact(item);
    setFormData({});
    setMsg("");
    setErr("");
  }

  function onFieldChange(key, value) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Konservasyon Oluştur</h1>
          <p className="mt-1 text-sm text-slate-600">Önce buluntu seçin, ardından ilgili konservasyon formunu doldurun.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" type="button" onClick={() => navigate("/konservasyon/listele")}>
            Listeye Git
          </Button>
        </div>
      </div>

      {msg ? <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{msg}</div> : null}
      {err ? <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{err}</div> : null}

      <Card>
        <CardHeader>
          <CardTitle>Buluntu Seçimi</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-slate-700">Genel Arama</label>
              <div className="mt-1.5">
                <Input
                  value={searchFilters.q}
                  onChange={(e) => setSearchFilters((prev) => ({ ...prev, q: e.target.value }))}
                  placeholder="Buluntu no, anakod, dönem..."
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">Anakod</label>
              <div className="mt-1.5">
                <Input
                  value={searchFilters.main_code_code}
                  onChange={(e) => setSearchFilters((prev) => ({ ...prev, main_code_code: e.target.value }))}
                  placeholder="AAA"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">Buluntu No</label>
              <div className="mt-1.5">
                <Input
                  inputMode="numeric"
                  value={searchFilters.artifact_no}
                  onChange={(e) =>
                    setSearchFilters((prev) => ({
                      ...prev,
                      artifact_no: e.target.value.replace(/\D/g, ""),
                    }))
                  }
                  placeholder="1234"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-slate-700">Buluntu Yeri</label>
              <div className="mt-1.5">
                <Input
                  value={searchFilters.finding_place}
                  onChange={(e) => setSearchFilters((prev) => ({ ...prev, finding_place: e.target.value }))}
                  placeholder="Buluntu yeri girin"
                />
              </div>
            </div>

            <div className="flex items-end">
              <Button type="button" variant="secondary" onClick={onSearchArtifacts} disabled={searchLoading}>
                {searchLoading ? "Aranıyor..." : "Buluntu Ara"}
              </Button>
            </div>
          </div>

          {searchError ? <div className="text-sm text-rose-700">{searchError}</div> : null}

          <div className="grid gap-2">
            {searchResults.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                Arama sonuçları burada listelenir.
              </div>
            ) : (
              searchResults.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      {item.full_artifact_no || `${item.main_code_code || ""}${item.artifact_no || ""}`}
                    </div>
                    <div className="text-xs text-slate-500">
                      {item.main_code_finding_place || "Buluntu yeri yok"} · {item.production_material || "Malzeme yok"}
                    </div>
                  </div>
                  <Button type="button" variant="secondary" onClick={() => onSelectArtifact(item)}>
                    Seç
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Konservasyon Formu</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          {!selectedArtifact ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
              Önce bir buluntu seçin.
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <div className="font-semibold">{selectedArtifact.full_artifact_no || "Buluntu"}</div>
                <div className="text-xs text-slate-500">
                  Yapım Malzemesi: {selectedArtifact.production_material || "Belirtilmemiş"}
                </div>
              </div>

              {materialFields.length === 0 ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  Bu yapım malzemesi için henüz form alanları tanımlı değil. Alanları paylaştığınızda burada
                  gösterilecektir.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {materialFields.map((field) => (
                    <div key={field.key}>
                      <label className="text-sm font-semibold text-slate-700">{field.label}</label>
                      <div className="mt-1.5">
                        <Input value={formData[field.key] || ""} onChange={(e) => onFieldChange(field.key, e.target.value)} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
