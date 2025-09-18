# README — UWB Radar UI (Frontend)

Interfaz web para visualizar un radar UWB con FOV de 120° (±60° respecto del eje vertical). Detección de personas y objetos, render en canvas 2D, y modo **mock** para probar sin backend.

---

## 1. Objetivo del proyecto

- Mostrar en tiempo real **tracks** (personas/objetos) en un **abanico 120°** con **0° hacia arriba**.
- Indicar **distancia**, **ángulo**, **confianza**, **velocidad aproximada**, **SNR** y **presencia**.
- Permitir **depuración** básica (calidad, recalibración) y **simulación** sin hardware.

---

## 2. Stack y decisiones

- **HTML/CSS + Bootstrap 5**: layout responsivo, componentes de UI comunes.
- **JavaScript (ES Modules)**: separación por responsabilidades.
- **PixiJS** (2D acelerado) para el canvas del radar.
  - **Sugerido**: Pixi v7 (API sincrónica y estable para este caso).
  - Alternativa: Pixi v8 (requiere `await app.init()` y `app.canvas`).

- **Modo mock** 100% frontend: datos sintéticos para abrir el `index.html` sin servidor.

---

## 3. Estructura de carpetas

```
uwb-frontend/
├─ public/
│  ├─ index.html          # Entrada de la app (Bootstrap, Pixi, UI)
│  ├─ styles.css          # Ajustes de estilos
│  └─ icons/              # (opcional) íconos
├─ src/
│  ├─ config/
│  │  └─ endpoints.js     # Definición centralizada de endpoints (REST/RT)
│  ├─ services/
│  │  ├─ apiClient.js     # Cliente REST (get/post, timeouts, errores)
│  │  └─ realtime.js      # Canal en tiempo real (WS/SSE/polling)
│  ├─ state/
│  │  └─ store.js         # Estado global simple (device, tracks, calidad)
│  ├─ components/
│  │  ├─ RadarCanvas.js   # Render del abanico 120°, tracks, grilla
│  │  ├─ TrackList.js     # Lista de tracks (UI lateral)
│  │  └─ QualityPanel.js  # Panel de calidad (SNR/ruido)
│  ├─ utils/
│  │  ├─ geometry.js      # Conversión polar→canvas con 0° arriba
│  │  └─ smoothing.js     # Suavizado / interpolación
│  └─ main.js             # Bootstrap de la app, wiring de componentes
├─ mock/
│  ├─ mockData.js         # Motor de datos sintéticos (tracks/calidad/presencia)
│  └─ mockWire.js         # Capa que simula API REST + realtime
└─ package.json           # (opcional) si se usa Vite o http-server
```

---

## 4. Vistas y UI principales

**`public/index.html`**
- Navbar con **estado del dispositivo** (Conectado/Desconectado).
- Tarjeta central con **Radar (FOV 120°)** y controles:
  - **Pause** de render, **Recalibrar** (simulado), **FPS** objetivo.
- Panel lateral:
  - **Resumen** (personas, objetos, presencia, ruido).
  - **Tracks** (lista con ID, r, θ, v, confianza).
  - **Calidad / Salud** (SNR y ruido).
- Carga de **PixiJS** y de la app (`src/main.js`).
- Para modo mock, inyecta:
  ```html
  <script>window.__MOCK__ = true;</script>
  <script src="../mock/mockData.js"></script>
  <script src="../mock/mockWire.js"></script>
  ```

**`public/styles.css`**
- Escala del canvas, badges de estado, prefijos visuales en lista de tracks.

---

## 5. Lógica y componentes

**`src/state/store.js`**
- Estado compartido: `device`, `fovDeg=120`, `quality`, `presence`, `tracks`, `paused`.

**`src/config/endpoints.js`**
- Define `API_BASE` y `RT_URL` (pueden venir de `data-*` en `<body>`).
- Endpoints semilla (placeholders) como `health`, `presence`, `quality`, `tracks`, `actions/recal`, `events`.

**`src/services/apiClient.js`**
- `get(url)` / `post(url, body)` con timeout.
- Manejo básico de errores HTTP.

**`src/services/realtime.js`**
- `openRealtime(onMessage, { protocol })`:
  - WebSocket (preferido), fallback a SSE o polling.
  - Normaliza mensajes en formato `{type, data}`.

**`src/utils/geometry.js`**
- `polarToXY(r, thetaDeg, maxR, w, h)` convierte coordenadas polares a canvas con:
  - **0° en vertical hacia arriba**.
  - **±60°** como límites del FOV (se dibuja desde el vértice inferior del abanico).
  - Escalado radial en función de `maxR`.

**`src/utils/smoothing.js`**
- `lerp/smooth` para transiciones suaves (opcional).

**`src/components/RadarCanvas.js`**
- Crea la aplicación Pixi y dos capas: **grilla** (`gGrid`) y **tracks** (`gTracks`).
- `drawGrid()`:
  - Sombreado del **FOV** (120° con 0° vertical).
  - **Líneas angulares** cada 15°.
  - **Anillos de distancia** (número configurable).
  - **Eje 0°** resaltado.
- `render({ tracks, quality })`:
  - Dibuja puntos por track (color por clase; alpha por confianza).
  - **Cola** de velocidad simple (opcional) en la dirección radial.
- `setMaxRange(r)` y `setFPS(fps)` para sincronizar escala y refresco.

**`src/components/TrackList.js`**
- Lista de tracks: ID, clase, `r`, `θ`, `v` y badge de **confianza**.

**`src/components/QualityPanel.js`**
- Muestra **SNR** y **ruido**, con badges.

**`src/main.js`**
- Ancla componentes al DOM, instancia `RadarCanvas`.
- **Bootstrap**:
  - Comprueba `/health`, ajusta estado del dispositivo.
  - Carga `presence` y `quality` iniciales.
  - Abre **realtime** y actualiza UI con cada mensaje.
  - Loop de animación con `requestAnimationFrame` (respeta **Pause** y **FPS**).
- **Mock on/off**:
  - Si `window.__MOCK__` es `true`, `main.js` usa `window.Mock.apiGet/apiPost/openRealtime`.
  - Si es `false`, usa `API` + `openRealtime` reales.

---

## 6. Modo mock (sin servidor)

**Activación**
- En `index.html` añadir:
  ```html
  <script>window.__MOCK__ = true;</script>
  <script src="../mock/mockData.js"></script>
  <script src="../mock/mockWire.js"></script>
  ```
- Abrir `public/index.html` (doble click).
- Verás radar, tracks, SNR, presencia y controles.

**`mock/mockData.js`**
- `MockEngine` simula:
  - 2–3 objetivos (personas/objetos) dentro de **±60°** y `maxRange=5 m`.
  - Movimiento suave, rebote al tocar los bordes del FOV.
  - Deriva de **SNR** y `noise` según SNR.
  - **Presence** basada en movimiento (OCPD-style).
  - `snapshot()`, `recalibrate()`, `start(onMessage, hz)`.

**`mock/mockWire.js`**
- Implementa `apiGet`, `apiPost`, `openRealtime` usando el `MockEngine`.
- Equivale a REST/WS del backend.
- Expuesto como `window.Mock`.

**Contratos de datos (mock y real)**
- Realtime:
  - `{"type":"tracks","data":[{id, cls, r, thetaDeg, v, conf, snr}] }`
  - `{"type":"quality","data":{snr, noise}}`
  - `{"type":"presence","data":{present, note}}`
- REST:
  - `GET /health` → `{status:"ok"}`
  - `GET /presence` → `{present:boolean, note?:string}`
  - `GET /quality` → `{snr:number, noise:string}`
  - `GET /tracks` → `Track[]`
  - `POST /actions/recal` → `{ok:true}`
  - `GET /events?...` → `[]` (mock vacío)

---

## 7. Escala de distancia y anillos

- `RadarCanvas` usa un radio de dibujo `R = h * 0.9` y un **`maxRange`** (en metros).
- La conversión radial es lineal: `rho = r * (R / maxRange)`.
- Para definir **cuántos milímetros por anillo**:
  1. Elige `rings` (p. ej., 6).
  2. Define `maxRange` acorde a tu escala (p. ej., `maxRange = rings * 0.5 m` si cada anillo = 0.5 m).
  3. Llama `radar.setMaxRange(maxRange)` y vuelve a dibujar la grilla (ya lo hace internamente).
- Si más adelante usás **mm** en vez de **m**, mantén una sola unidad interna (recomendado **m** en frontend) y convierte en la ingesta de datos.

---

## 8. Cómo ejecutar

### A) Sin servidor (solo mock)
1) Asegurar:
   ```html
   <script>window.__MOCK__ = true;</script>
   <script src="../mock/mockData.js"></script>
   <script src="../mock/mockWire.js"></script>
   ```
2) Abrir `public/index.html` (doble click).
3) Verás radar, tracks, SNR, presencia y controles.

### B) Servidor estático (recomendado para ESM)
- **Python**:
  ```bash
  cd uwb-frontend
  python -m http.server 8080
  # Abrir http://localhost:8080/public/index.html
  ```
- **Node (http-server)**:
  ```bash
  cd uwb-frontend
  npx http-server -p 8080 .
  ```
- **Vite (dev server)**:
  ```bash
  npm init -y
  npm i -D vite
  # vite.config.js
  export default { root:'public', server:{ fs:{ allow:['..'] } } };
  # package.json scripts: { "dev":"vite" }
  npm run dev
  ```

---

## 9. Nota sobre PixiJS (v7 vs v8)

- **v7 (recomendado para este código)**:
  ```html
  <script src="https://cdn.jsdelivr.net/npm/pixi.js@7.4.0/dist/pixi.min.js"></script>
  ```
  - `new PIXI.Application({ ... })`
  - Adjuntar con `rootEl.appendChild(app.view)`

- **v8 (si se usa)**:
  - `const app = new PIXI.Application(); await app.init({...});`
  - Adjuntar con `rootEl.appendChild(app.canvas)`
  - Asegurar `await` antes de dibujar (ver ejemplo en la conversación).

---

## 10. Integración futura con backend

- Desactivar mock:
  - Eliminar scripts de `mock` y `window.__MOCK__ = true;`
- Configurar endpoints:
  - Definir `data-api-base` y `data-realtime-url` en `<body>`, o editar `src/config/endpoints.js`.
- Proveer eventos de realtime en formato `{type, data}` como en el mock.

---

## 11. Accesibilidad y UX

- Contraste adecuado en badges y trazos.
- Tooltips textuales para valores clave (r, θ, v, confianza).
- Estados siempre legibles (texto + color).
- Mensajes claros de limitaciones (p. ej., presencia basada en movimiento).

---

## 12. Rendimiento

- `requestAnimationFrame` y control de FPS.
- Batches de dibujo en Pixi.
- Estado inmutable simple para minimizar trabajo por frame.
- Posible **object pooling** si la cantidad de tracks crece.

---

## 13. Solución de problemas

- **“Cannot read properties of undefined (reading 'canvas' / 'view')”**: versión de Pixi incorrecta. Use v7 (o adapte a v8 con `await app.init()`).
- **Canvas vacío**: el contenedor `#radar-root` debe tener altura; revisar `styles.css`.
- **ESM/CORS**: no abrir con `file://` si usás fetch; usar mock o servidor HTTP.
- **No aparecen tracks**: verificar que `window.__MOCK__ = true` y que `mock/*.js` se cargan antes de `main.js`.

---

## 14. Personalización rápida

- **FOV**: fijo a 120° (±60°). Ajustable en `drawGrid()` si fuera necesario.
- **Anillos**: editar `rings` en `drawGrid()` o exponer setter.
- **Rango máximo**: `radar.setMaxRange(metros)`.
- **FPS**: input en UI y `radar.setFPS(fps)`.

---

## 15. Próximos pasos

- Agregar **zonas** (segmentos dentro del FOV) con reglas de entrada/salida.
- Mostrar **trayectorias** (buffer de posiciones por track).
- Exportar **eventos** a CSV/JSON.
- Panel de **depuración** con **CIR** y **heatmap** si el backend provee datos.
