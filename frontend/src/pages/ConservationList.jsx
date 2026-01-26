import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardBody, CardTitle } from "../ui/Card.jsx";
import Button from "../ui/Button.jsx";

export default function ConservationList() {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Konservasyon Listele</h1>
          <p className="mt-1 text-sm text-slate-600">Konservasyon kayıtlarını görüntüleyin.</p>
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" type="button" onClick={() => navigate("/konservasyon/olustur")}>
            Yeni Kayıt
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Konservasyon Kayıtları</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
            Henüz konservasyon kaydı bulunmuyor.
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
