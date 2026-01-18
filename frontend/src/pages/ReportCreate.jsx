import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardBody, CardHeader, CardTitle } from "../ui/Card.jsx";
import Button from "../ui/Button.jsx";
import Input from "../ui/Input.jsx";
import Select from "../ui/Select.jsx";
import RichTextEditor from "../components/RichTextEditor.jsx";

function getCurrentUserName() {
  return (
    localStorage.getItem("userFullName") ||
    localStorage.getItem("user_full_name") ||
    localStorage.getItem("user_name") ||
    "Giriş yapan kullanıcı"
  );
}

function toUniqueFindingPlaces(mainCodes) {
  const set = new Set();
  for (const code of mainCodes) {
    if (code.finding_place) {
      set.add(code.finding_place);
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, "tr"));
}

export default function ReportCreate() {
  const navigate = useNavigate();
  const [mainCodes, setMainCodes] = useState([]);
  const [artifacts, setArtifacts] = useState([]);

  const [form, setForm] = useState({
    report_type: "",
    report_author: getCurrentUserName(),
    finding_place: "",
    writing_date: "",
    work_year: "",
    report_title: "",
    report_description: "",
    artifacts: [],
  });

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    Promise.all([
      apiGet("/api/main-codes/?page_size=500"),
      apiGet("/api/artifacts/?page_size=500"),
    ])
      .then(([mainCodePayload, artifactPayload]) => {
        setMainCodes((mainCodePayload.results || mainCodePayload) ?? []);
        setArtifacts((artifactPayload.results || artifactPayload) ?? []);
      })
      .catch((e) => setErr(e.message || "Veriler yüklenemedi."));

  }, []);

  const findingPlaces = useMemo(() => toUniqueFindingPlaces(mainCodes), [mainCodes]);

  function onChangeField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onChangeWorkYear(value) {
    const next = String(value || "").replace(/\D/g, "").slice(0, 4);
    setForm((prev) => ({ ...prev, work_year: next }));
  }

  function onChangeArtifacts(event) {
    const values = Array.from(event.target.selectedOptions).map((opt) => opt.value);
    setForm((prev) => ({ ...prev, artifacts: values }));
  }


    event.preventDefault();
    setMsg("");
    setErr("");

    if (!form.report_type || !form.finding_place || !form.writing_date || form.work_year.length !== 4) {
      setErr("Rapor tipi, buluntu yeri, yazım tarihi ve 4 haneli çalışma yılı zorunludur.");
      return;
    }


  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Rapor Oluştur</h1>
          <p className="mt-1 text-sm text-slate-600">Rapor bilgilerini kaydedin.</p>
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" type="button" onClick={() => navigate("/rapor/listele")}
          >
            Listeye Git
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Genel Bilgiler</CardTitle>
        </CardHeader>
        <CardBody>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-slate-700">Rapor Tipi</label>
                <div className="mt-1.5">
                  <Select
                    required
                    value={form.report_type}
                    onChange={(e) => onChangeField("report_type", e.target.value)}
                  >
                    <option value="">Seçiniz...</option>

                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Raporu Hazırlayan</label>
                <div className="mt-1.5">
                  <Input value={form.report_author} readOnly />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Buluntu Yeri</label>
                <div className="mt-1.5">
                  <Select
                    required
                    value={form.finding_place}
                    onChange={(e) => onChangeField("finding_place", e.target.value)}
                  >
                    <option value="">Seçiniz...</option>
                    {findingPlaces.map((place) => (
                      <option key={place} value={place}>
                        {place}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Yazım Tarihi</label>
                <div className="mt-1.5">
                  <Input
                    type="date"
                    required
                    value={form.writing_date}
                    onChange={(e) => onChangeField("writing_date", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Çalışma Yılı</label>
                <div className="mt-1.5">
                  <Input
                    required
                    inputMode="numeric"
                    maxLength={4}
                    value={form.work_year}
                    onChange={(e) => onChangeWorkYear(e.target.value)}
                    placeholder="2024"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-slate-700">Rapor Başlık</label>
                <div className="mt-1.5">
                  <Input
                    value={form.report_title}
                    onChange={(e) => onChangeField("report_title", e.target.value)}
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-slate-700">Rapor Açıklama</label>
                <div className="mt-1.5">
                  <RichTextEditor
                    value={form.report_description}
                    onChange={(value) => onChangeField("report_description", value)}
                    placeholder="Rapor içeriğini girin."
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-slate-700">Buluntular</label>
                <div className="mt-1.5">
                  <Select multiple value={form.artifacts} onChange={onChangeArtifacts}>
                    {artifacts.map((artifact) => (
                      <option key={artifact.id} value={String(artifact.id)}>
                        {artifact.full_artifact_no || artifact.artifact_no || artifact.id}
                      </option>
                    ))}
                  </Select>
                </div>
                <p className="mt-1 text-xs text-slate-500">Bu rapora dahil edilecek buluntuları seçin.</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="primary" type="submit">
                Rapor Kaydet
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
