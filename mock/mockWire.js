// Enlaza el motor de datos sintéticos al "contrato" del frontend:
// - API GET/POST equivalentes
// - openRealtime(...) equivalente a WebSocket/SSE

(function(){
  const engine = new window.MockEngine();

  function apiGet(url){
    // Ruteo simple según fin del path
    const end = (url||"").toLowerCase();
    if (end.endsWith("/health"))   return Promise.resolve({ status: "ok" });
    if (end.endsWith("/device"))   return Promise.resolve({ connected:true, mode:"radar" });
    if (end.endsWith("/presence")) return Promise.resolve(engine.snapshot().presence);
    if (end.endsWith("/quality"))  return Promise.resolve(engine.snapshot().quality);
    if (end.endsWith("/tracks"))   return Promise.resolve(engine.snapshot().tracks);
    if (end.includes("/events"))   return Promise.resolve([]); // sin histórico en mock
    return Promise.resolve({});
  }

  function apiPost(url, body){
    const end = (url||"").toLowerCase();
    if (end.endsWith("/actions/recal")){
      engine.recalibrate();
      return Promise.resolve({ ok:true });
    }
    return Promise.resolve({ ok:true });
  }

  function openRealtime(onMessage, { hz=15 } = {}){
    engine.start(onMessage, hz);
    return {
      close: () => engine.stop(),
      send:  () => {} // sin-ops en mock
    };
  }

  // Exponer en window para que main.js pueda usarlo si __MOCK__ = true
  window.Mock = { apiGet, apiPost, openRealtime, _engine: engine };
})();
