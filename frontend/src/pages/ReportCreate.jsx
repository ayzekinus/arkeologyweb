import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPost } from "../api.js";
import { Card, CardHeader, CardBody, CardTitle } from "../ui/Card.jsx";
import Button from "../ui/Button.jsx";
import Input from "../ui/Input.jsx";
import Select from "../ui/Select.jsx";

const REPORT_TYPES = [
  { value: "GENEL", label: "Genel" },
  { value: "KAZI", label: "Kazı" },
  { value: "LAB", label: "Laboratuvar" },
  { value: "KONSERVASYON", label: "Konservasyon" },
  { value: "DIGER", label: "Diğer" },
];

function RichTextEditor({ value, onChange, placeholder }) {
  const editorRef = useRef(null);

  useEffect(() => {
    if (!editorRef.current) return;
    if (editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  function exec(command, commandValue = null) {
    document.execCommand(command, false, commandValue);
    editorRef.current?.focus();
  }

  function onInput(e) {
    onChange(e.currentTarget.innerHTML);
  }

  function addLink() {
    const url = prompt("Bağlantı URL'sini girin:");
    if (url) exec("createLink", url);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-wrap gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2">
        <button type="button" className="text-xs font-semibold" onClick={() => exec("bold")}>
          Kalın
        </button>
        <button type="button" className="text-xs font-semibold" onClick={() => exec("italic")}>
          Italik
        </button>
        <button type="button" className="text-xs font-semibold" onClick={() => exec("underline")}>
          Altı Çizili
        </button>
        <button type="button" className="text-xs font-semibold" onClick={() => exec("insertUnorderedList")}>
          Liste
        </button>
        <button type="button" className="text-xs font-semibold" onClick={() => exec("insertOrderedList")}>
          Numaralı Liste
        </button>
        <button type="button" className="text-xs font-semibold" onClick={addLink}>
          Bağlantı
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={onInput}
        className="rich-editor min-h-[180px] px-3 py-2 text-sm text-slate-700 focus:outline-none"
        data-placeholder={placeholder}
      />
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

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Dosya okunamadı."));
    reader.readAsDataURL(file);
  });
}

export default function ReportCreate() {
  const navigate = useNavigate();
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const formId = "report-create-form";

  const [mainCodes, setMainCodes] = useState([]);

  const [form, setForm] = useState({
    report_type: "",
    prepared_by: "",
    finding_place: "",
    writing_date: "",
    study_year: "",
    title: "",
    description: "",
  });

  const [selectedArtifacts, setSelectedArtifacts] = useState([]);
  const [gallery, setGallery] = useState([]);

  const [searchFilters, setSearchFilters] = useState({
    q: "",
    main_code_code: "",
    finding_place: "",
    artifact_no: "",
  });
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  const findingPlaceOptions = useMemo(() => {
    const set = new Set();
    mainCodes.forEach((item) => {
      if (item.finding_place_label) set.add(item.finding_place_label);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "tr"));
  }, [mainCodes]);

  useEffect(() => {
    const fullName = localStorage.getItem("user_full_name") || "Oturum Açan Kullanıcı";
    setForm((prev) => ({ ...prev, prepared_by: fullName }));
  }, []);

  useEffect(() => {
    apiGet("/api/main-codes/?page_size=500")
      .then((data) => setMainCodes((data.results || data) ?? []))
      .catch((e) => setErr(e.message || "Buluntu yeri listesi alınamadı."));
  }, []);

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

  function addArtifact(item) {
    setSelectedArtifacts((prev) => {
      if (prev.some((a) => a.id === item.id)) return prev;
      return [...prev, item];
    });
  }

  function removeArtifact(id) {
    setSelectedArtifacts((prev) => prev.filter((a) => a.id !== id));
  }

  async function onGalleryChange(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    try {
      const next = await Promise.all(
        files.map(async (file) => ({
          name: file.name,
          url: await toBase64(file),
        }))
      );
      setGallery((prev) => [...prev, ...next]);
    } catch (e2) {
      setErr(e2.message || "Fotoğraflar yüklenemedi.");
    } finally {
      e.target.value = "";
    }
  }

  function removeImage(idx) {
    setGallery((prev) => prev.filter((_, i) => i !== idx));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setMsg("");
    try {
      await apiPost("/api/reports/", {
        report_type: form.report_type,
        prepared_by: form.prepared_by,
        finding_place: form.finding_place,
        writing_date: form.writing_date,
        study_year: form.study_year ? Number(form.study_year) : null,
        title: form.title,
        description: form.description,
        artifacts: selectedArtifacts.map((a) => a.id),
        images: gallery,
      });
      setMsg("Rapor kaydedildi.");
      setForm((prev) => ({
        ...prev,
        report_type: "",
        finding_place: "",
        writing_date: "",
        study_year: "",
        title: "",
        description: "",
      }));
      setSelectedArtifacts([]);
      setGallery([]);
    } catch (e3) {
      setErr(e3.message || "Rapor kaydedilemedi.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Rapor Oluştur</h1>
          <p className="mt-1 text-sm text-slate-600">Rapor bilgilerini kaydedin ve buluntuları ekleyin.</p>
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" type="button" onClick={() => navigate("/rapor/listele")}>
            Listeye Git
          </Button>
          <Button type="submit" form={formId}>
            Kaydet
          </Button>
        </div>
      </div>

      {msg ? <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{msg}</div> : null}
      {err ? <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{err}</div> : null}

      <Card>
        <CardHeader>
          <CardTitle>Rapor Bilgileri</CardTitle>
        </CardHeader>
        <CardBody>
          <form id={formId} onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-slate-700">Rapor Tipi</label>
                <div className="mt-1.5">
                  <Select
                    required
                    value={form.report_type}
                    onChange={(e) => setForm((prev) => ({ ...prev, report_type: e.target.value }))}
                  >
                    <option value="">Seçiniz...</option>
                    {REPORT_TYPES.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Raporu Hazırlayan</label>
                <div className="mt-1.5">
                  <Input value={form.prepared_by} readOnly />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Buluntu Yeri</label>
                <div className="mt-1.5">
                  <Input
                    list="finding-places"
                    value={form.finding_place}
                    onChange={(e) => setForm((prev) => ({ ...prev, finding_place: e.target.value }))}
                    placeholder="Buluntu yeri seçin veya yazın"
                    required
                  />
                  <datalist id="finding-places">
                    {findingPlaceOptions.map((place) => (
                      <option key={place} value={place} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Yazım Tarihi</label>
                <div className="mt-1.5">
                  <Input
                    type="date"
                    value={form.writing_date}
                    onChange={(e) => setForm((prev) => ({ ...prev, writing_date: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Çalışma Yılı</label>
                <div className="mt-1.5">
                  <Input
                    inputMode="numeric"
                    value={form.study_year}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        study_year: e.target.value.replace(/\D/g, "").slice(0, 4),
                      }))
                    }
                    placeholder="2024"
                    required
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500">4 haneli yıl bilgisi.</p>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-slate-700">Rapor Başlığı</label>
                <div className="mt-1.5">
                  <Input
                    value={form.title}
                    onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Rapor başlığını girin"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">Rapor Açıklama</label>
              <div className="mt-2">
                <RichTextEditor
                  value={form.description}
                  onChange={(value) => setForm((prev) => ({ ...prev, description: value }))}
                  placeholder="Rapor açıklamasını girin"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit">Kaydet</Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Buluntular</CardTitle>
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
                  list="finding-places-search"
                  value={searchFilters.finding_place}
                  onChange={(e) => setSearchFilters((prev) => ({ ...prev, finding_place: e.target.value }))}
                  placeholder="Buluntu yeri girin"
                />
                <datalist id="finding-places-search">
                  {findingPlaceOptions.map((place) => (
                    <option key={place} value={place} />
                  ))}
                </datalist>
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
                      {item.main_code_finding_place || "Buluntu yeri yok"} · {item.form_type || "Form yok"}
                    </div>
                  </div>
                  <Button type="button" variant="secondary" onClick={() => addArtifact(item)}>
                    Ekle
                  </Button>
                </div>
              ))
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-700">Seçili Buluntular</h3>
            <div className="mt-2 grid gap-2">
              {selectedArtifacts.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                  Henüz buluntu eklenmedi.
                </div>
              ) : (
                selectedArtifacts.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        {item.full_artifact_no || `${item.main_code_code || ""}${item.artifact_no || ""}`}
                      </div>
                      <div className="text-xs text-slate-500">
                        {item.main_code_finding_place || "Buluntu yeri yok"} · {item.form_type || "Form yok"}
                      </div>
                    </div>
                    <Button type="button" variant="secondary" onClick={() => removeArtifact(item.id)}>
                      Kaldır
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fotoğraf Galerisi</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Input type="file" accept="image/*" multiple onChange={onGalleryChange} />
            <span className="text-xs text-slate-500">Birden fazla fotoğraf ekleyebilirsiniz.</span>
          </div>

          {gallery.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
              Henüz fotoğraf eklenmedi.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {gallery.map((img, idx) => (
                <div key={`${img.name}-${idx}`} className="group relative overflow-hidden rounded-xl border">
                  <img src={img.url} alt={img.name} className="h-32 w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-slate-700 shadow"
                  >
                    Sil
                  </button>
                  <div className="truncate px-2 py-1 text-xs text-slate-500">{img.name}</div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
