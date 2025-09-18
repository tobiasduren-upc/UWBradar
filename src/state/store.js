export const Store = {
  device: { connected: false, mode: "radar" },
  fovDeg: 120,
  quality: { snr: null, noise: null },
  presence: { present: null, note: "" },
  tracks: [],   // [{id, r, thetaDeg, cls: "person"|"object", v: m_s, conf: 0..1, snr}]
  paused: false,
};
