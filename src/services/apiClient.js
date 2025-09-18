import { Endpoints } from "../config/endpoints.js";

const TIMEOUT_MS = 7000;

async function withTimeout(promise, ms = TIMEOUT_MS) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await promise(ctrl.signal);
    clearTimeout(t);
    return res;
  } catch (e) {
    clearTimeout(t);
    throw e;
  }
}

async function get(url) {
  return withTimeout(async (signal) => {
    const r = await fetch(url, { signal });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  });
}

async function post(url, body) {
  return withTimeout(async (signal) => {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
      signal
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json().catch(() => ({}));
  });
}

export const API = {
  Endpoints,
  get,
  post,
};
