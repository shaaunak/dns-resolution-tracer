// All communication with the FastAPI backend lives in this file.
export const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

function fail(code, message) {
  const err = new Error(message);
  err.code = code;
  return err;
}

export async function getHealth() {
  const res = await fetch(`${API_URL}/api/health`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// POST /api/trace. The backend returns the same JSON shape for success AND for
// handled errors (HTTP 400 / 422 / 500), so we read the body whatever the status is.
export async function traceDomain(domain, recordType) {
  let res;
  try {
    res = await fetch(`${API_URL}/api/trace`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain, record_type: recordType }),
    });
  } catch {
    throw fail("BACKEND_UNREACHABLE", `Could not connect to ${API_URL}.`);
  }

  let body = null;
  try {
    body = await res.json();
  } catch {
    // body was not JSON; handled below
  }

  if (body && typeof body === "object" && "steps" in body) return body;
  throw fail("BAD_RESPONSE", `Unexpected response from the server (HTTP ${res.status}).`);
}

// POST /api/cache/clear
export async function clearCache() {
  const res = await fetch(`${API_URL}/api/cache/clear`, { method: "POST" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
