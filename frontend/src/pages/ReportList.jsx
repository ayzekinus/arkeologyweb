import React from "react";
import { Card, CardBody, CardHeader, CardTitle } from "../ui/Card.jsx";
import Button from "../ui/Button.jsx";
import { useNavigate } from "react-router-dom";

export default function ReportList() {
  const navigate = useNavigate();

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
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
            Henüz rapor bulunmuyor.
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
