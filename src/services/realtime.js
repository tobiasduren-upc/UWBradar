import { Endpoints } from "../config/endpoints.js";

export function openRealtime(onMessage, { protocol="ws" } = {}) {
  const url = Endpoints.realtime;

  if (protocol === "ws" && "WebSocket" in window) {
    const ws = new WebSocket(url);
    ws.onmessage = (ev) => { try { onMessage(JSON.parse(ev.data)); } catch {} };
    return {
      close: () => ws.close(),
      send:  (obj) => ws.readyState === 1 && ws.send(JSON.stringify(obj))
    };
  }

  if (!!window.EventSource) {
    const es = new EventSource(url.replace(/^ws/, "http"));
    es.onmessage = (ev) => { try { onMessage(JSON.parse(ev.data)); } catch {} };
    return { close: () => es.close(), send: () => {} };
  }

  // Polling como último recurso
  let stop = false;
  (async function loop() {
    while(!stop) {
      try {
        const r = await fetch(url.replace(/^ws/, "http"));
        const data = await r.json();
        onMessage(data);
      } catch {}
      await new Promise(r => setTimeout(r, 500));
    }
  })();
  return { close: () => { stop = true; }, send: () => {} };
}
