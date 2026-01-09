function parseApiError(payload) {
  if (!payload) return "İşlem başarısız.";
  if (typeof payload === "string") return payload;
  if (payload.detail) return payload.detail;
  // DRF field errors
  if (typeof payload === "object") {
    const parts = [];
    for (const [k, v] of Object.entries(payload)) {
      if (Array.isArray(v)) parts.push(`${k}: ${v.join(" ")}`);
      else if (typeof v === "string") parts.push(`${k}: ${v}`);
    }
    if (parts.length) return parts.join(" | ");
  }
  try { return JSON.stringify(payload); } catch { return "İşlem başarısız."; }
}

export async function apiGet(url) {
  const r = await fetch(url, { headers: { "Accept": "application/json" } });
  if (!r.ok) throw new Error(`GET ${url} failed: ${r.status}`);
  return r.json();
}

export async function apiPost(url, body) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    let payload = null;
    try { payload = await r.json(); } catch { payload = await r.text(); }
    throw new Error(parseApiError(payload));
  }
  return r.json();
}

export async function apiPut(url, body) {
  const r = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    let payload = null;
    try { payload = await r.json(); } catch { payload = await r.text(); }
    throw new Error(parseApiError(payload));
  }
  return r.json();
}

export async function apiPatch(url, body) {
  const r = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    let payload = null;
    try { payload = await r.json(); } catch { payload = await r.text(); }
    throw new Error(parseApiError(payload));
  }
  return r.json();
}

export async function apiDelete(url) {
  const r = await fetch(url, { method: "DELETE" });
  if (!r.ok && r.status !== 204) {
    let payload = null;
    try { payload = await r.json(); } catch { payload = await r.text(); }
    throw new Error(parseApiError(payload));
  }
}
