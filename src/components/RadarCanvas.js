import { polarToXY } from "../utils/geometry.js";

export class RadarCanvas {
  constructor(rootEl, { maxRange = 5, targetFPS = 30 } = {}) {
    this.rootEl = rootEl;
    this.maxRange = maxRange;
    this.targetFPS = targetFPS;
    this.width = rootEl.clientWidth || 800;
    this.height = rootEl.clientHeight || 520;

    this.app = new PIXI.Application({
      width: this.width, height: this.height, antialias: true, backgroundAlpha: 0
    });
    rootEl.appendChild(this.app.view);

    this.gGrid = new PIXI.Graphics();
    this.gTracks = new PIXI.Graphics();
    this.app.stage.addChild(this.gGrid, this.gTracks);

    this.lastTime = 0;
    this.drawGrid();
  }

  setMaxRange(r){ this.maxRange = r; this.drawGrid(); }
  setFPS(fps){ this.targetFPS = Math.max(5, Math.min(60, fps)); }

  drawGrid(){
  const g = this.gGrid; g.clear();
  const w = this.width, h = this.height;
  const cx = w/2, cy = h*0.95;
  const R = h*0.9;         // radio máximo para dibujar el FOV
  const fovMin = -60, fovMax = +60;

  // Helper: grados (0° arriba) -> radianes canvas
  const deg2radCanvas = (deg) => (deg - 90) * Math.PI / 180;

  // Sombreado del FOV (abanico 120°)
  g.beginFill(0x2b3035, 0.6);
  g.moveTo(cx, cy);
  g.arc(cx, cy, R, deg2radCanvas(fovMin), deg2radCanvas(fovMax));
  g.closePath();
  g.endFill();

  // Anillos de distancia (líneas de rango)
  g.lineStyle(1, 0x495057, 1);
  const rings = 6; // configurable: cantidad de anillos
  for (let i = 1; i <= rings; i++) {
    const rr = (R * i) / rings;
    g.moveTo(cx, cy);
    g.arc(cx, cy, rr, deg2radCanvas(fovMin), deg2radCanvas(fovMax));
  }

  // Líneas angulares (cada 15° dentro de ±60°)
  g.lineStyle(1, 0x6c757d, 0.9);
  for (let a = fovMin; a <= fovMax; a += 15) {
    const phi = deg2radCanvas(a);
    const ex = cx + R * Math.cos(phi);
    const ey = cy + R * Math.sin(phi);
    g.moveTo(cx, cy);
    g.lineTo(ex, ey);
  }

  // Eje central (0°) más destacado
  g.lineStyle(2, 0xadb5bd, 1);
  const phi0 = deg2radCanvas(0);
  g.moveTo(cx, cy);
  g.lineTo(cx + R * Math.cos(phi0), cy + R * Math.sin(phi0));
}


  render({ tracks=[], quality={} }){
    const now = performance.now();
    if (now - this.lastTime < 1000/this.targetFPS) return;
    this.lastTime = now;

    const g = this.gTracks; g.clear();

    for (const t of tracks){
      const { x, y } = polarToXY(t.r, t.thetaDeg, this.maxRange, this.width, this.height);
      // color por clase y confianza
      const color = t.cls === "person" ? 0x74c69d : 0xadb5bd;
      const alpha = Math.max(0.3, Math.min(1, (t.conf ?? 0.7)));
      g.beginFill(color, alpha);
      g.drawCircle(x, y, 6);
      g.endFill();

      // Velocidad como cola
      if (t.v && t.v > 0.01){
        g.lineStyle(2, color, 0.6);
        const tail = polarToXY(Math.max(0, t.r - t.v*0.5), t.thetaDeg, this.maxRange, this.width, this.height);
        g.moveTo(x, y); g.lineTo(tail.x, tail.y);
      }
    }
  }

  destroy(){ this.app?.destroy(true, { children: true, texture: true, baseTexture: true }); }
}
