export function renderQuality(el, { snr=null, noise=null }){
  el.innerHTML = `
    <div class="d-flex justify-content-between">
      <div>SNR</div><div><span class="badge ${snr>=15?'bg-success':'bg-warning text-dark'}">${snr ?? '—'}</span></div>
    </div>
    <div class="d-flex justify-content-between">
      <div>Ruido</div><div><span class="badge bg-secondary">${noise ?? '—'}</span></div>
    </div>`;
}
