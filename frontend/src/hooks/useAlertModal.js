import { useCallback, useState } from "react";

const DEFAULT_ALERT = {
  open: false,
  type: "info",
  title: "",
  message: "",
};

export default function useAlertModal() {
  const [alert, setAlert] = useState(DEFAULT_ALERT);

  const showAlert = useCallback((next) => {
    if (typeof next === "string") {
      setAlert({ open: true, type: "info", title: "", message: next });
      return;
    }

    const { type = "info", title = "", message = "" } = next || {};
    setAlert({ open: true, type, title, message });
  }, []);

  const hideAlert = useCallback(() => {
    setAlert((prev) => ({ ...prev, open: false, message: "" }));
  }, []);

  return { alert, showAlert, hideAlert };
}
