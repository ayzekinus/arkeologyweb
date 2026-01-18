import React, { useEffect, useState } from "react";
import { Card, CardBody, CardHeader, CardTitle } from "../ui/Card.jsx";
import Button from "../ui/Button.jsx";
import { useNavigate } from "react-router-dom";
import { apiGet } from "../api.js";

export default function ReportList() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    apiGet("/api/reports/?page_size=200")
      .then((payload) => setReports((payload.results || payload) ?? []))
      .catch((e) => setErr(e.message || "Raporlar yüklenemedi."));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Rapor Listele</h1>
          <p className="mt-1 text-sm text-slate-600">Oluşturulan raporları buradan yönetin.</p>
        </div>

        <div className="flex gap-2">
          <Button variant="primary" type="button" onClick={() => navigate("/rapor/olustur")}>
            Yeni Rapor
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Raporlar</CardTitle>
        </CardHeader>
        <CardBody>
          {err ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {err}
            </div>
          ) : null}

          {reports.length ? (
            <div className="overflow-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    {["Başlık", "Rapor Tipi", "Buluntu Yeri", "Çalışma Yılı", "Yazım Tarihi"].map((h) => (
                      <th key={h} className="border-b border-slate-200 px-2 py-2">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report.id} className="hover:bg-slate-50">
                      <td className="border-b border-slate-100 px-2 py-2 font-semibold">
                        {report.report_title || "Başlıksız"}
                      </td>
                      <td className="border-b border-slate-100 px-2 py-2">
                        {report.report_type_name || report.report_type}
                      </td>
                      <td className="border-b border-slate-100 px-2 py-2">{report.finding_place}</td>
                      <td className="border-b border-slate-100 px-2 py-2">{report.work_year}</td>
                      <td className="border-b border-slate-100 px-2 py-2">{report.writing_date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
              Henüz rapor bulunmuyor.
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
