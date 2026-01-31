import React from "react";
import Modal from "./Modal.jsx";
import Button from "../ui/Button.jsx";

const TYPE_STYLES = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  error: "border-rose-200 bg-rose-50 text-rose-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  info: "border-slate-200 bg-slate-50 text-slate-900",
};

const TYPE_TITLES = {
  success: "Başarılı",
  error: "Hata",
  warning: "Uyarı",
  info: "Bilgi",
};

export default function AlertModal({
  open,
  onClose,
  type = "info",
  title,
  message,
  actionLabel = "Tamam",
}) {
  if (!open) return null;

  const resolvedTitle = title || TYPE_TITLES[type] || TYPE_TITLES.info;
  const resolvedStyle = TYPE_STYLES[type] || TYPE_STYLES.info;

  return (
    <Modal open={open} onClose={onClose} title={resolvedTitle} width="min(520px, 100%)">
      <div className={`rounded-xl border p-3 text-sm ${resolvedStyle}`}>{message}</div>
      <div className="mt-4 flex justify-end">
        <Button variant="primary" type="button" onClick={onClose}>
          {actionLabel}
        </Button>
      </div>
    </Modal>
  );
}
