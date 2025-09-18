export const Endpoints = (() => {
  // Valores por defecto (se pueden sobreescribir por data attributes o .env)
  const body = document.body;
  const API_BASE = body.dataset.apiBase || "http://localhost:8080/api";
  const RT_URL   = body.dataset.realtimeUrl || "ws://localhost:8080/stream";

  return {
    base: API_BASE,
    realtime: RT_URL,

    health:      () => `${API_BASE}/health`,
    deviceInfo:  () => `${API_BASE}/device`,
    presence:    () => `${API_BASE}/presence`,
    tracks:      () => `${API_BASE}/tracks`,
    quality:     () => `${API_BASE}/quality`,
    recalibrate: () => `${API_BASE}/actions/recal`,
    // histórico / export
    events:      (q="") => `${API_BASE}/events${q}`,
  };
})();
