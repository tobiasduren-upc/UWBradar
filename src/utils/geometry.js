export function polarToXY(r, thetaDeg, maxR, w, h) {
  const cx = w / 2;
  const cy = h * 0.95;            // vértice del abanico (abajo)
  const scale = (h * 0.9) / (maxR > 0 ? maxR : 1);

  // Pasar de "0° arriba" a radianes del canvas (0 = eje X positivo)
  const phi = (thetaDeg - 90) * Math.PI / 180;  // shift -90°
  const rho = r * scale;

  return {
    x: cx + rho * Math.cos(phi),
    y: cy + rho * Math.sin(phi)
  };
}