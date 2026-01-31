import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiGet, apiPost, apiPut } from "../api.js";
import AlertModal from "../components/AlertModal.jsx";
import SchemaFields from "../components/SchemaFields.jsx";
import useAlertModal from "../hooks/useAlertModal.js";
import { Card, CardHeader, CardBody, CardTitle } from "../ui/Card.jsx";
import Button from "../ui/Button.jsx";
import Input from "../ui/Input.jsx";

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
  const { id } = useParams();
  const isEditing = Boolean(id);
  const { alert, showAlert, hideAlert } = useAlertModal();
  const [lookups, setLookups] = useState({});
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedArtifact, setSelectedArtifact] = useState(null);
  const [formData, setFormData] = useState({});
  const [formSchemas, setFormSchemas] = useState([]);
  const [formsLoading, setFormsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingLoaded, setEditingLoaded] = useState(false);

  const [searchFilters, setSearchFilters] = useState({
    q: "",
    main_code_code: "",
    finding_place: "",
    artifact_no: "",
  });

  const materialLabel = useMemo(
    () => String(selectedArtifact?.production_material || "").trim(),
    [selectedArtifact]
  );

  useEffect(() => {
    apiGet("/api/lookups/?keys=FINDING_PLACE")
      .then((data) => setLookups(data || {}))
      .catch(() => setLookups({}));
  }, []);

  useEffect(() => {
    if (!isEditing) return;
    hideAlert();
    apiGet(`/api/conservations/${id}/`)
      .then(async (data) => {
        const artifactId = data?.artifact;
        if (artifactId) {
          const artifact = await apiGet(`/api/artifacts/${artifactId}/`);
          setSelectedArtifact(artifact);
        }
        setFormData(data?.data || {});
      })
      .catch((e) => showAlert({ type: "error", message: e.message || "Konservasyon kaydı alınamadı." }))
      .finally(() => setEditingLoaded(true));
  }, [hideAlert, id, isEditing, showAlert]);

  useEffect(() => {
    if (!selectedArtifact) {
      setFormSchemas([]);
      return;
    }
    const material = String(selectedArtifact.production_material || "").trim();
    if (!material) {
      setFormSchemas([]);
      return;
    }
    setFormsLoading(true);
    apiGet(`/api/forms/by-material?material=${encodeURIComponent(material)}`)
      .then(async (data) => {
        const forms = data?.forms || [];
        if (!forms.length) {
          setFormSchemas([]);
          return;
        }
        const schemas = await Promise.all(
          forms.map(async (form) => {
            const payload = await apiGet(`/api/forms/${form.key}/schema/`);
            return { ...payload, form };
          })
        );
        setFormSchemas(schemas);
      })
      .catch((e) => showAlert({ type: "error", message: e.message || "Konservasyon formları alınamadı." }))
      .finally(() => setFormsLoading(false));
  }, [selectedArtifact, showAlert]);

  useEffect(() => {
    if (!formSchemas.length) return;
    const hasConservator = formSchemas.some((schema) =>
      (schema.sections || []).some((sec) => (sec.fields || []).some((f) => f.key === "conservation.conservator"))
    );
    if (!hasConservator) return;
    setFormData((prev) => {
      if (prev["conservation.conservator"]) return prev;
      const fullName = localStorage.getItem("user_full_name") || "Oturum Açan Kullanıcı";
      return { ...prev, "conservation.conservator": fullName };
    });
  }, [formSchemas]);

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
    if (isEditing) return;
    setSelectedArtifact(item);
    setFormData({});
    hideAlert();
  }

  function onFieldChange(key, value) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  function collectImages(payload) {
    const images = [];
    Object.entries(payload || {}).forEach(([key, value]) => {
      if (!key.toLowerCase().includes("image")) return;
      if (Array.isArray(value)) {
        value.forEach((item) => {
          if (item?.url) images.push(item);
        });
      }
    });
    return images;
  }

  async function onSave() {
    if (!selectedArtifact) {
      showAlert({ type: "error", message: "Lütfen önce buluntu seçin." });
      return;
    }
    hideAlert();
    try {
      setSaving(true);
      const formKeys = formSchemas.map((schema) => schema?.form?.key).filter(Boolean);
      const images = collectImages(formData);
      const payload = {
        artifact: selectedArtifact.id,
        material: selectedArtifact.production_material || "",
        form_keys: formKeys,
        data: formData,
        images,
        conservator: formData["conservation.conservator"] || "",
      };
      if (isEditing) {
        await apiPut(`/api/conservations/${id}/`, payload);
        showAlert({ type: "success", message: "Konservasyon kaydı güncellendi." });
      } else {
        await apiPost("/api/conservations/", payload);
        showAlert({ type: "success", message: "Konservasyon kaydı oluşturuldu." });
      }
      setFormData({});
    } catch (e) {
      showAlert({ type: "error", message: e.message || "Konservasyon kaydı kaydedilemedi." });
    } finally {
      setSaving(false);
    }
  }

  function lookupOptions(key) {
    return Array.isArray(lookups?.[key]) ? lookups[key] : [];
  }

  function adaptFieldDef(fd) {
    const base = {
      key: fd.key,
      label: fd.label || fd.key,
      required: !!fd.required,
      readonly: !!fd.readonly,
      helpText: fd.help_text || "",
      fullWidth: !!fd.full_width,
      inputType: fd.data_type === "int" || fd.data_type === "decimal" ? "number" : "text",
      order: typeof fd.order === "number" ? fd.order : 999,
    };

    if (fd.unit_group) {
      return {
        ...base,
        kind: "measure",
        unitKey: `${fd.key}_unit`,
        unitType: fd.unit_group,
        unitOptions: fd.unit_options || [],
        inputType: "number",
      };
    }

    if (fd.data_type === "text") return { ...base, kind: "textarea" };
    if (fd.data_type === "bool") return { ...base, kind: "bool" };
    if (fd.data_type === "date") return { ...base, kind: "date" };
    if (fd.data_type === "file") {
      return { ...base, kind: "file", multiple: fd.key.endsWith("images") || fd.key.endsWith("image") };
    }

    if (fd.data_type === "multiselect") {
      const options = (fd.choices && fd.choices.length ? fd.choices : lookupOptions(fd.list_type));
      return { ...base, kind: "multiselect", options };
    }

    if (fd.data_type === "choice" || fd.data_type === "select") {
      const options = (fd.choices && fd.choices.length ? fd.choices : lookupOptions(fd.list_type));
      if (options.length) {
        return { ...base, kind: "enum", options };
      }
      return { ...base, kind: "text" };
    }

    return { ...base, kind: "text" };
  }

  const dynamicSections = useMemo(() => {
    const sections = [];
    formSchemas.forEach((schema) => {
      const titlePrefix = schema?.form?.title ? `${schema.form.title} - ` : "";
      (schema.sections || []).forEach((sec) => {
        const fields = (sec.fields || []).map((fd) => adaptFieldDef(fd));
        fields.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
        sections.push({ title: `${titlePrefix}${sec.title}`, fields });
      });
    });
    return sections;
  }, [formSchemas, lookups]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">{isEditing ? "Konservasyon Güncelle" : "Konservasyon Oluştur"}</h1>
          <p className="mt-1 text-sm text-slate-600">
            {isEditing
              ? "Seçili buluntu için konservasyon formunu güncelleyin."
              : "Önce buluntu seçin, ardından ilgili konservasyon formunu doldurun."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" type="button" onClick={() => navigate("/konservasyon/listele")}>
            Listeye Git
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Buluntu Seçimi</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          {isEditing ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              {selectedArtifact ? (
                <>
                  <div className="font-semibold">{selectedArtifact.full_artifact_no || "Buluntu"}</div>
                  <div className="text-xs text-slate-500">
                    Yapım Malzemesi: {selectedArtifact.production_material || "Belirtilmemiş"}
                  </div>
                </>
              ) : (
                <div>{editingLoaded ? "Buluntu bilgisi alınamadı." : "Buluntu bilgisi yükleniyor..."}</div>
              )}
            </div>
          ) : (
            <>
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
            </>
          )}
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
                  Yapım Malzemesi: {materialLabel || "Belirtilmemiş"}
                </div>
              </div>

              {formsLoading ? (
                <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                  Konservasyon formu yükleniyor...
                </div>
              ) : dynamicSections.length === 0 ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  Bu yapım malzemesi için henüz form alanları tanımlı değil. Alanları paylaştığınızda burada
                  gösterilecektir.
                </div>
              ) : (
                dynamicSections.map((section, idx) => (
                  <SchemaFields
                    key={`${section.title}-${idx}`}
                    title={section.title}
                    schema={section.fields}
                    data={formData}
                    onChange={onFieldChange}
                  />
                ))
              )}

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="primary" type="button" onClick={onSave} disabled={saving}>
                  {saving ? "Kaydediliyor..." : isEditing ? "Güncelle" : "Kaydet"}
                </Button>
              </div>
            </>
          )}
        </CardBody>
      </Card>

      <AlertModal open={alert.open} type={alert.type} title={alert.title} message={alert.message} onClose={hideAlert} />
    </div>
  );
}
