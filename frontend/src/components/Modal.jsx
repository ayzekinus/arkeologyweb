import React from "react";
import Button from "../ui/Button.jsx";
import { Card, CardHeader, CardBody, CardTitle } from "../ui/Card.jsx";

export default function Modal({ open, title, onClose, children, width }) {
  if (!open) return null;

  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[1000] grid place-items-center bg-black/50 p-4"
    >
      <Card className="w-full overflow-hidden" style={{ width: width || "min(980px, 100%)" }}>
        <CardHeader className="flex items-center justify-between gap-3">
          <CardTitle>{title}</CardTitle>
          <Button variant="secondary" onClick={onClose}>
            Kapat
          </Button>
        </CardHeader>
        <CardBody>{children}</CardBody>
      </Card>
    </div>
  );
}
