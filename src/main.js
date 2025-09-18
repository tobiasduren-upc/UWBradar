import { API } from "./services/apiClient.js";
import { openRealtime } from "./services/realtime.js";
import { Store } from "./state/store.js";
import { RadarCanvas } from "./components/RadarCanvas.js";
import { renderTrackList } from "./components/TrackList.js";
import { renderQuality } from "./components/QualityPanel.js";

const USE_MOCK = typeof window !== "undefined" && window.__MOCK__ && window.Mock;
const elRadar = document.getElementById("radar-root");
const elTracks = document.getElementById("track-list");
const elQuality = document.getElementById("quality-panel");
const elPresence = document.getElementById("presence");
const elPeople = document.getElementById("people-count");
const elObjects = document.getElementById("object-count");
const elStatus = document.getElementById("device-status");
const elFPS = document.getElementById("fps");
const elSNR = document.getElementById("snr");

const radar = new RadarCanvas(elRadar, { maxRange: 5, targetFPS: 30 });

// UI handlers
document.getElementById("btn-pause").onclick = () => Store.paused = !Store.paused;
// Botón recalibrar:
document.getElementById("btn-recal").onclick = async () => {
  try {
    if (USE_MOCK) await window.Mock.apiPost("/actions/recal", {});
    else          await API.post(API.Endpoints.recalibrate(), {});
  } catch(e){}
};

document.getElementById("fps-input").onchange = (e) => {
  const v = parseInt(e.target.value||30,10);
  radar.setFPS(v); elFPS.textContent = `FPS: ${v}`;
};

// Inicial
(async function bootstrap(){
  try {
    if (USE_MOCK) { await window.Mock.apiGet("/health"); }
    else{ await API.get(API.Endpoints.health()); }
    Store.device.connected = true;
    elStatus.textContent = "Conectado";
    elStatus.className = "badge bg-success";
  } catch {
    elStatus.textContent = "Sin conexión";
    elStatus.className = "badge bg-danger";
  }

  refreshStatic();
  startRealtime();
  animationLoop();
})();

async function refreshStatic(){
  try {
    const presence = USE_MOCK
      ? await window.Mock.apiGet("/presence")
      : await API.get(API.Endpoints.presence());
    Store.presence = presence;
    elPresence.textContent = presence.present ? "Presente" : "Ausente";
    elPresence.setAttribute("data-bad", presence.present ? "ok" : "warn");
  } catch {}

  try {
    const q = USE_MOCK
      ? await window.Mock.apiGet("/quality")
      : await API.get(API.Endpoints.quality());
    Store.quality = q; elSNR.textContent = `SNR: ${q?.snr ?? '—'}`;
    renderQuality(elQuality, q);
  } catch {}
}


function startRealtime(){
  const openRT = USE_MOCK ? window.Mock.openRealtime : openRealtime;

  openRT((msg) => {
    if (msg.type === "tracks"){
      Store.tracks = msg.data || [];
      const people = Store.tracks.filter(t=>t.cls==='person').length;
      const objects = Store.tracks.filter(t=>t.cls!=='person').length;
      elPeople.textContent = people;
      elObjects.textContent = objects;
      renderTrackList(elTracks, Store.tracks);
    }
    if (msg.type === "quality"){
      Store.quality = msg.data || {};
      elSNR.textContent = `SNR: ${Store.quality?.snr ?? '—'}`;
      renderQuality(elQuality, Store.quality);
    }
    if (msg.type === "presence"){
      Store.presence = msg.data || {};
      elPresence.textContent = Store.presence.present ? "Presente" : "Ausente";
    }
  }, { protocol: "ws", hz: 15 });
}


function animationLoop(){
  requestAnimationFrame(animationLoop);
  if (Store.paused) return;
  radar.render({ tracks: Store.tracks, quality: Store.quality });
}
