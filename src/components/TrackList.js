export function renderTrackList(el, tracks){
  el.innerHTML = "";
  tracks.forEach(t => {
    const li = document.createElement("li");
    li.className = `list-group-item d-flex justify-content-between align-items-center ${t.cls==='person'?'list-track-person':'list-track-object'}`;
    li.innerHTML = `
      <div>
        <div><strong>ID ${t.id}</strong> · ${t.cls}</div>
        <div class="text-muted">r=${t.r.toFixed(2)} m · θ=${t.thetaDeg.toFixed(1)}° · v=${(t.v??0).toFixed(2)} m/s</div>
      </div>
      <span class="badge bg-${(t.conf??0.7) > 0.75 ? 'success': (t.conf>0.5?'warning text-dark':'secondary')}">
        ${(t.conf??0.7*100).toFixed(0)}%
      </span>`;
    el.appendChild(li);
  });
}
