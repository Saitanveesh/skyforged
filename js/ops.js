/* ============================================
   SkyForged — Operations Center Logic
   Flight Time Estimator & Go/No-Go Matrix
   ============================================ */

function calcFlightTime() {
  const auwRaw = document.getElementById('ftAuw').value;
  const capRaw = document.getElementById('ftCap').value;
  const cellsRaw = document.getElementById('ftCells').value;
  const effRaw = document.getElementById('ftEff').value;

  const auw = parseFloat(auwRaw) || 0;
  const capMha = parseFloat(capRaw) || 0;
  const cells = parseInt(cellsRaw) || 0;
  const eff = parseFloat(effRaw) || 1; // Prevent div by zero

  const outHover = document.getElementById('outHoverMins');
  const outMix = document.getElementById('outMixMins');
  const outPayload = document.getElementById('outPayload');

  if (auw <= 0 || capMha <= 0 || cells <= 0) {
    outHover.textContent = '—';
    outMix.textContent = '—';
    outPayload.textContent = '—';
    return;
  }

  // 1. Calculate Watt-hours (Wh)
  const voltagePerCell = 3.7;
  const voltage = cells * voltagePerCell;
  const wh = (capMha / 1000) * voltage;

  // 2. Calculate Watts required to hover
  const hoverWatts = auw / eff;

  // 3. Time
  const hoverHours = wh / hoverWatts;
  let hoverMins = hoverHours * 60;
  
  // Real-world buffer (LiPo usually flown to 80% depletion)
  hoverMins = hoverMins * 0.8;
  const mixMins = hoverMins * 0.45;

  // 4. Payload (Assuming 3:1 Thrust-to-Weight, max safe hover at 60% throttle)
  const maxThrust = auw * 3;
  const maxSafeHoverWeight = maxThrust * 0.6;
  let maxPayload = maxSafeHoverWeight - auw;
  if (maxPayload < 0) maxPayload = 0;

  // Render with "pulse" effect for feedback
  [outHover, outMix, outPayload].forEach(el => {
    el.style.animation = 'none';
    el.offsetHeight; // trigger reflow
    el.style.animation = 'pulse-subtle 0.3s ease-out';
  });

  outHover.textContent = isFinite(hoverMins) ? hoverMins.toFixed(1) + ' min' : '—';
  outMix.textContent = isFinite(mixMins) ? mixMins.toFixed(1) + ' min' : '—';
  outPayload.innerHTML = isFinite(maxPayload) ? `~${maxPayload.toFixed(0)}g` : '—';
  outPayload.style.color = maxPayload > 0 ? 'var(--accent)' : 'var(--danger)';
}

function calcGoNoGo() {
  const windIn = document.getElementById('gnWind');
  const kpIn = document.getElementById('gnKp');
  const satsIn = document.getElementById('gnSats');
  const battIn = document.getElementById('gnBatt');
  
  if (!windIn || !kpIn || !satsIn || !battIn) return;

  const wind = parseFloat(windIn.value);
  const kp = parseInt(kpIn.value);
  const sats = parseInt(satsIn.value);
  const batt = battIn.value;

  const box = document.getElementById('gnResultBox');
  const reasons = [];

  // Wind logic
  if (wind > 40) reasons.push("CRITICAL WIND (>40 km/h)");
  else if (wind > 25) reasons.push("HIGH WIND WARNING");

  // Kp Logic
  if (kp > 5) reasons.push("SEVERE GEOMAGNETIC STORM (Kp > 5). GPS lock degraded.");
  else if (kp >= 4) reasons.push("ELEVATED Kp INDEX (Kp 4). Monitor GPS.");

  // Sats
  if (sats < 10) reasons.push("INSUFFICIENT GPS SATELLITES (<10)");

  // Battery
  if (batt === 'low') reasons.push("BATTERY CRITICALLY LOW");
  else if (batt === 'storage') reasons.push("BATTERY AT STORAGE VOLTAGE. DO NOT FLY.");

  if (reasons.length === 0) {
    box.style.border = "1px solid var(--accent)";
    box.style.background = "rgba(0, 255, 255, 0.05)";
    box.innerHTML = `
      <div style="font-size:3rem;font-weight:900;color:var(--accent);letter-spacing:0.1em;text-shadow:0 0 15px rgba(0,255,255,0.4);">GO</div>
      <div style="color:var(--text-muted);font-family:var(--font-mono);margin-top:8px;">All environmental & hardware limits nominal.</div>
    `;
  } else {
    const isCritical = reasons.some(r => r.includes('CRITICAL') || r.includes('SEVERE') || r.includes('INSUFFICIENT') || r.includes('DO NOT FLY'));
    const color = isCritical ? 'var(--danger)' : 'var(--warning)';
    
    box.style.border = `1px solid ${color}`;
    box.style.background = isCritical ? "rgba(255, 51, 51, 0.05)" : "rgba(255, 187, 0, 0.05)";
    
    box.innerHTML = `
      <div style="font-size:2.5rem;font-weight:900;color:${color};letter-spacing:0.1em;text-shadow:0 0 15px ${isCritical ? 'rgba(255,51,51,0.4)' : 'transparent'};">${isCritical ? 'NO-GO' : 'MARGINAL'}</div>
      <ul style="text-align:left;color:var(--text);font-family:var(--font-mono);font-size:0.85rem;margin-top:16px;list-style-type:square;padding-left:16px;">
        ${reasons.map(r => `<li style="margin-bottom:8px;">${r}</li>`).join('')}
      </ul>
    `;
  }
}

// Initial calc & Interactivity binding
document.addEventListener('DOMContentLoaded', () => {
  const inputs = ['ftAuw', 'ftCap', 'ftCells', 'ftEff'];
  
  if(document.getElementById('ftAuw')) {
    calcFlightTime();
    calcGoNoGo();

    // Bind every input to calc logic and ensure interactivity
    inputs.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', calcFlightTime);
        el.addEventListener('focus', calcFlightTime);

        // EXTRA SECURITY: Ensure clicking the input focuses it and STOPS propagation
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          el.focus();
        });

        // Ensure these are never disabled
        el.removeAttribute('disabled');
        el.style.pointerEvents = 'auto';
      }
    });

    // Go/No-Go Inputs
    ['gnWind', 'gnKp', 'gnSats', 'gnBatt'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', calcGoNoGo);
        el.addEventListener('change', calcGoNoGo);
        
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          el.focus();
        });
        
        el.removeAttribute('disabled');
        el.style.pointerEvents = 'auto';
      }
    });
  }
});
