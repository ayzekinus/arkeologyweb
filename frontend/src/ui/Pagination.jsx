import React from "react";
import Button from "./Button.jsx";

export default function Pagination({ page, pageSize, count, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil((count || 0) / (pageSize || 1)));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="text-sm text-slate-600">
        Toplam: <span className="font-semibold text-slate-900">{count ?? 0}</span> kayıt —{" "}
        Sayfa <span className="font-semibold text-slate-900">{page}</span> /{" "}
        <span className="font-semibold text-slate-900">{totalPages}</span>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="secondary" type="button" onClick={() => onPageChange(1)} disabled={!canPrev}>
          İlk
        </Button>
        <Button variant="secondary" type="button" onClick={() => onPageChange(page - 1)} disabled={!canPrev}>
          Önceki
        </Button>
        <Button variant="secondary" type="button" onClick={() => onPageChange(page + 1)} disabled={!canNext}>
          Sonraki
        </Button>
        <Button variant="secondary" type="button" onClick={() => onPageChange(totalPages)} disabled={!canNext}>
          Son
        </Button>
      </div>
    </div>
  );
}
