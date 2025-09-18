// Genera datos sintéticos coherentes con un radar UWB y FOV 120°.

(function(){
  const rand = (a,b)=> a + Math.random()*(b-a);
  const clamp = (x,a,b)=> Math.min(b, Math.max(a,x));
  const pick  = (arr)=> arr[(Math.random()*arr.length)|0];

  class MockEngine {
    constructor(){
      this.maxRange = 5;     // metros
      this.fovMin = -60;     // grados
      this.fovMax = +60;     // grados
      this.tracks = [];
      this.t0 = performance.now();
      this.presence = { present:false, note:"motion-based" };
      this.quality  = { snr: 18, noise: "low" };
      this._tickTimer = null;
      this._onMsg = null;

      // semillas iniciales
      this._spawnInitial();
    }

    _spawnInitial(){
      // 2 personas + 1 objeto
      this.tracks = [
        this._mkTrack(1, "person", 2.2, -20, +0.18),
        this._mkTrack(2, "person", 3.1, +25, -0.12),
        this._mkTrack(3, "object", 1.4,  +5,  +0.00),
      ];
      this._updatePresence();
    }

    _mkTrack(id, cls, r, theta, v){
      return {
        id, cls,
        r,             // metros
        thetaDeg: theta,
        v: Math.abs(v),        // m/s (magnitud)
        vTheta: v>=0 ? +1 : -1,// dirección angular
        conf: cls === "person" ? 0.82 : 0.62,
        snr: 16 + Math.random()*6
      };
    }

    _jitterQuality(){
      // paseo aleatorio suave
      const drift = rand(-0.5, 0.5);
      this.quality.snr = clamp((this.quality.snr ?? 18) + drift, 10, 28);
      // ruido: low/med/high según snr
      this.quality.noise = this.quality.snr > 20 ? "low" : (this.quality.snr > 15 ? "medium" : "high");
    }

    _updatePresence(){
      const movingCount = this.tracks.filter(t => t.cls==="person" && t.v > 0.02).length;
      this.presence.present = movingCount > 0; // presencia basada en movimiento
    }

    _step(dt){
      // Mover tracks
      for (const t of this.tracks){
        // radio oscila levemente
        t.r += rand(-0.03, 0.03);
        t.r = clamp(t.r, 0.5, this.maxRange - 0.1);

        // ángulo deriva suavemente
        t.thetaDeg += t.vTheta * rand(3, 8) * (dt/1000);
        if (t.thetaDeg < this.fovMin || t.thetaDeg > this.fovMax){
          t.vTheta *= -1; // rebote en los bordes del FOV
          t.thetaDeg = clamp(t.thetaDeg, this.fovMin, this.fovMax);
        }

        // variación pequeña de confianza y snr por track
        t.conf = clamp(t.conf + rand(-0.01, 0.01), 0.4, 0.95);
        t.snr  = clamp(t.snr  + rand(-0.6, 0.6), 10, 28);

        // de vez en cuando, aparecer/desaparecer un track
        if (Math.random() < 0.002){
          // quitar
          this.tracks = this.tracks.filter(x => x.id !== t.id);
        }
      }

      // Spawn ocasional
      if (this.tracks.length < 3 && Math.random() < 0.02){
        const id = (Math.max(0, ...this.tracks.map(t=>t.id)) + 1) || 1;
        const cls = Math.random() < 0.7 ? "person" : "object";
        this.tracks.push(this._mkTrack(
          id, cls,
          rand(0.8, 4.5),
          rand(this.fovMin+5, this.fovMax-5),
          rand(-0.25, 0.25)
        ));
      }

      this._jitterQuality();
      this._updatePresence();
    }

    snapshot(){
      return {
        tracks: this.tracks.map(t => ({
          id: t.id,
          cls: t.cls,
          r: +t.r,
          thetaDeg: +t.thetaDeg,
          v: +t.v,
          conf: +t.conf,
          snr: +t.snr
        })),
        quality: { ...this.quality },
        presence: { ...this.presence }
      };
    }

    recalibrate(){
      // simular recalibración: mejora SNR y estabiliza
      this.quality.snr = Math.max(20, (this.quality.snr ?? 18) + 3);
      this.quality.noise = "low";
    }

    start(onMessage, hz=15){
      this._onMsg = onMessage;
      const frameMs = Math.floor(1000/Math.max(5, Math.min(60, hz)));
      let last = performance.now();

      this._tickTimer = setInterval(() => {
        const now = performance.now();
        const dt = now - last; last = now;
        this._step(dt);

        const snap = this.snapshot();

        // Emitimos como si fuese un stream realtime
        onMessage({ type:"tracks",  data: snap.tracks  });
        onMessage({ type:"quality", data: snap.quality });
        onMessage({ type:"presence",data: snap.presence});
      }, frameMs);
    }

    stop(){
      if (this._tickTimer) clearInterval(this._tickTimer);
      this._tickTimer = null;
      this._onMsg = null;
    }
  }

  window.MockEngine = MockEngine;
})();
