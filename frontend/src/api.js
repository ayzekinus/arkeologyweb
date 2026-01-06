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
    const t = await r.text();
    throw new Error(`POST ${url} failed: ${r.status} ${t}`);
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
    const t = await r.text();
    throw new Error(`PATCH ${url} failed: ${r.status} ${t}`);
  }
  return r.json();
}

export async function apiDelete(url) {
  const r = await fetch(url, { method: "DELETE" });
  if (!r.ok && r.status !== 204) {
    const t = await r.text();
    throw new Error(`DELETE ${url} failed: ${r.status} ${t}`);
  }
}
