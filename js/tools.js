/* ============================================
   FORGE — RF Tools & Calculator Engines
   Real physics formulas for all calculators
   ============================================ */

// ── FPV Channel Database ───────────────────
const FPV_CHANNELS = {
  'A': [5865, 5845, 5825, 5805, 5785, 5765, 5745, 5725],
  'B': [5733, 5752, 5771, 5790, 5809, 5828, 5847, 5866],
  'E': [5705, 5685, 5665, 5645, 5885, 5905, 5925, 5945],
  'F': [5740, 5760, 5780, 5800, 5820, 5840, 5860, 5880],
  'R': [5658, 5695, 5732, 5769, 5806, 5843, 5880, 5917],
  'L': [5362, 5399, 5436, 5473, 5510, 5547, 5584, 5621]
};

const PILOT_COLORS = ['#00ffff', '#ff3366', '#00ff88', '#ffaa00', '#aa66ff', '#ff6600'];

// ── 1. Channel Planner ─────────────────────
function updateChannelPlanner() {
  const count = parseInt(document.getElementById('pilotCount').value);
  const band = document.getElementById('bandPref').value;
  const container = document.getElementById('channelResults');

  let channels;
  if (band === 'raceband') {
    channels = FPV_CHANNELS['R'].slice(0, count);
  } else if (band === 'fatshark') {
    channels = FPV_CHANNELS['F'].slice(0, count);
  } else {
    // Auto: pick best spaced channels across all bands
    channels = findBestChannels(count);
  }

  // Check conflicts
  const conflicts = [];
  for (let i = 0; i < channels.length; i++) {
    for (let j = i + 1; j < channels.length; j++) {
      const sep = Math.abs(channels[i] - channels[j]);
      if (sep < 40) {
        conflicts.push({ p1: i, p2: j, sep, freq1: channels[i], freq2: channels[j] });
      }
    }
  }

  let html = '<div style="margin-bottom:16px">';
  channels.forEach((freq, i) => {
    const bandName = findChannelName(freq);
    html += `<div class="result-row">
      <span class="result-label"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${PILOT_COLORS[i]};margin-right:8px;"></span>Pilot ${i + 1}</span>
      <span class="result-value">${freq} MHz <span style="color:var(--text-muted);font-weight:400;font-size:0.75rem;">${bandName}</span></span>
    </div>`;
  });
  html += '</div>';

  // Conflict analysis
  if (conflicts.length > 0) {
    html += '<div class="callout danger"><div class="callout-title">⚠ Conflicts Detected</div>';
    conflicts.forEach(c => {
      html += `<p>Pilot ${c.p1 + 1} (${c.freq1} MHz) ↔ Pilot ${c.p2 + 1} (${c.freq2} MHz): <strong>${c.sep} MHz separation</strong> — crosstalk likely</p>`;
    });
    html += '</div>';
  } else {
    html += '<div class="callout"><div class="callout-title">✓ No Conflicts</div><p>All channels have ≥40 MHz separation. Safe to fly.</p></div>';
  }

  // Visual channel map
  html += '<div style="margin-top:16px;"><div style="font-family:var(--font-mono);font-size:0.65rem;color:var(--text-muted);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.1em;">5.8 GHz Band Visualization</div>';
  html += '<div class="channel-visual">';
  const minF = 5620, maxF = 5950, range = maxF - minF;
  channels.forEach((freq, i) => {
    const pos = ((freq - minF) / range) * 100;
    html += `<div class="channel-marker" style="left:${pos}%;background:${PILOT_COLORS[i]};box-shadow:0 0 6px ${PILOT_COLORS[i]};"></div>`;
  });
  html += '</div></div>';

  container.innerHTML = html;
}

function findBestChannels(count) {
  const allFreqs = [];
  for (const [band, freqs] of Object.entries(FPV_CHANNELS)) {
    freqs.forEach((f, i) => allFreqs.push({ freq: f, band, ch: i + 1 }));
  }
  allFreqs.sort((a, b) => a.freq - b.freq);

  // Remove duplicates
  const unique = [];
  const seen = new Set();
  allFreqs.forEach(f => {
    if (!seen.has(f.freq)) { unique.push(f); seen.add(f.freq); }
  });

  // Greedy pick with max separation
  const picked = [unique[0]];
  for (let n = 1; n < count; n++) {
    let bestIdx = -1, bestMinDist = -1;
    for (let i = 0; i < unique.length; i++) {
      if (picked.some(p => p.freq === unique[i].freq)) continue;
      const minDist = Math.min(...picked.map(p => Math.abs(p.freq - unique[i].freq)));
      if (minDist > bestMinDist) { bestMinDist = minDist; bestIdx = i; }
    }
    if (bestIdx >= 0) picked.push(unique[bestIdx]);
  }
  return picked.map(p => p.freq).sort((a, b) => a - b);
}

function findChannelName(freq) {
  for (const [band, freqs] of Object.entries(FPV_CHANNELS)) {
    const idx = freqs.indexOf(freq);
    if (idx >= 0) return `${band}${idx + 1}`;
  }
  // Find nearest
  let closest = '', minDiff = Infinity;
  for (const [band, freqs] of Object.entries(FPV_CHANNELS)) {
    freqs.forEach((f, i) => {
      const diff = Math.abs(f - freq);
      if (diff < minDiff) { minDiff = diff; closest = `~${band}${i + 1} (±${diff} MHz)`; }
    });
  }
  return closest;
}

// ── 2. Harmonics Calculator ────────────────
function calcHarmonics() {
  const freq = parseFloat(document.getElementById('harmonicFreq').value);
  const count = parseInt(document.getElementById('harmonicCount').value);
  const container = document.getElementById('harmonicResults');
  if (!freq) return;

  const GPS_L1 = 1575.42;
  const GPS_L2 = 1227.60;
  const FPV_MIN = 5645;
  const FPV_MAX = 5945;

  let html = '<div class="table-wrap"><table><thead><tr><th>Harmonic</th><th>Frequency</th><th>Conflict</th></tr></thead><tbody>';

  for (let n = 1; n <= count; n++) {
    const h = freq * n;
    let conflict = '—';
    let cls = '';

    if (Math.abs(h - GPS_L1) < 20) {
      conflict = '⚠ Near GPS L1 (1575.42 MHz)';
      cls = ' class="danger"';
    } else if (Math.abs(h - GPS_L2) < 20) {
      conflict = '⚠ Near GPS L2 (1227.60 MHz)';
      cls = ' class="danger"';
    } else if (h >= FPV_MIN && h <= FPV_MAX) {
      const chName = findChannelName(Math.round(h));
      conflict = `⚠ Inside FPV band (${chName})`;
      cls = ' class="warn"';
    } else if (h >= 2400 && h <= 2484) {
      conflict = '⚠ Inside 2.4 GHz ISM';
      cls = ' class="warn"';
    }

    const fmtFreq = h >= 1000 ? (h / 1000).toFixed(3) + ' GHz' : h.toFixed(1) + ' MHz';
    html += `<tr><td>${n}× (${n === 1 ? 'fundamental' : 'H' + n})</td><td${cls ? ' style="color:var(--accent)"' : ''}>${fmtFreq}</td><td${cls ? ` style="color:${cls.includes('danger') ? 'var(--accent-alt)' : 'var(--accent-amber)'}"` : ''}>${conflict}</td></tr>`;
  }

  html += '</tbody></table></div>';
  container.innerHTML = html;
}

// ── 3. Range Estimator (Friis) ─────────────
function calcRange() {
  const txP = parseFloat(document.getElementById('rangeTxPower').value);
  const txG = parseFloat(document.getElementById('rangeTxGain').value);
  const rxG = parseFloat(document.getElementById('rangeRxGain').value);
  const freq = parseFloat(document.getElementById('rangeFreq').value);
  const rxS = parseFloat(document.getElementById('rangeRxSens').value);
  const margin = parseFloat(document.getElementById('rangeMargin').value);
  const container = document.getElementById('rangeResults');

  if (!freq || !txP) return;

  // Available path loss = txP + txG + rxG - rxS - margin
  const availablePL = txP + txG + rxG - rxS - margin;

  // Free-space path loss: FSPL = 20*log10(d) + 20*log10(f) + 32.44
  // where d in km, f in MHz
  // d = 10^((FSPL - 20*log10(f) - 32.44) / 20)
  const dKm = Math.pow(10, (availablePL - 20 * Math.log10(freq) - 32.44) / 20);
  const dM = dKm * 1000;

  // Path loss at reference distances
  const pl500m = 20 * Math.log10(0.5) + 20 * Math.log10(freq) + 32.44;
  const pl1km = 20 * Math.log10(1) + 20 * Math.log10(freq) + 32.44;
  const pl5km = 20 * Math.log10(5) + 20 * Math.log10(freq) + 32.44;
  const pl10km = 20 * Math.log10(10) + 20 * Math.log10(freq) + 32.44;

  const margin500 = txP + txG + rxG - pl500m - rxS;
  const margin1k = txP + txG + rxG - pl1km - rxS;
  const margin5k = txP + txG + rxG - pl5km - rxS;
  const margin10k = txP + txG + rxG - pl10km - rxS;

  let rangeStr, rangeCls;
  if (dM >= 1000) {
    rangeStr = (dM / 1000).toFixed(1) + ' km';
  } else {
    rangeStr = Math.round(dM) + ' m';
  }
  rangeCls = dM > 5000 ? 'good' : dM > 1000 ? 'result-value' : 'warn';

  let html = `
    <div class="result-row">
      <span class="result-label">Available Path Loss Budget</span>
      <span class="result-value">${availablePL.toFixed(1)} dB</span>
    </div>
    <div class="result-row">
      <span class="result-label">Maximum Free-Space Range</span>
      <span class="result-value ${rangeCls}">${rangeStr}</span>
    </div>
    <div class="result-row">
      <span class="result-label">TX Power</span>
      <span class="result-value">${txP} dBm (${Math.pow(10, txP / 10).toFixed(0)} mW)</span>
    </div>
    <div style="margin-top:20px;">
      <div style="font-family:var(--font-mono);font-size:0.7rem;color:var(--text-muted);margin-bottom:8px;text-transform:uppercase;letter-spacing:0.1em;">Margin at Distance</div>
      <div class="table-wrap"><table>
        <thead><tr><th>Distance</th><th>Path Loss</th><th>Margin</th><th>Status</th></tr></thead>
        <tbody>
          <tr><td>500 m</td><td>${pl500m.toFixed(1)} dB</td><td class="${margin500 > 20 ? '' : 'highlight'}">${margin500.toFixed(1)} dB</td><td>${margin500 > 20 ? '<span style="color:var(--accent-green)">✓ Strong</span>' : margin500 > 10 ? '<span style="color:var(--accent-amber)">⚠ Usable</span>' : '<span style="color:var(--accent-alt)">✕ Weak</span>'}</td></tr>
          <tr><td>1 km</td><td>${pl1km.toFixed(1)} dB</td><td>${margin1k.toFixed(1)} dB</td><td>${margin1k > 20 ? '<span style="color:var(--accent-green)">✓ Strong</span>' : margin1k > 10 ? '<span style="color:var(--accent-amber)">⚠ Usable</span>' : '<span style="color:var(--accent-alt)">✕ Weak</span>'}</td></tr>
          <tr><td>5 km</td><td>${pl5km.toFixed(1)} dB</td><td>${margin5k.toFixed(1)} dB</td><td>${margin5k > 20 ? '<span style="color:var(--accent-green)">✓ Strong</span>' : margin5k > 10 ? '<span style="color:var(--accent-amber)">⚠ Usable</span>' : '<span style="color:var(--accent-alt)">✕ Weak</span>'}</td></tr>
          <tr><td>10 km</td><td>${pl10km.toFixed(1)} dB</td><td>${margin10k.toFixed(1)} dB</td><td>${margin10k > 20 ? '<span style="color:var(--accent-green)">✓ Strong</span>' : margin10k > 10 ? '<span style="color:var(--accent-amber)">⚠ Usable</span>' : '<span style="color:var(--accent-alt)">✕ Weak</span>'}</td></tr>
        </tbody>
      </table></div>
    </div>
    <div class="callout" style="margin-top:16px;">
      <div class="callout-title">Environment Factors</div>
      <p>Open field: ×0.7 | Suburban: ×0.4 | Urban: ×0.2 | Forested: ×0.15</p>
    </div>`;

  container.innerHTML = html;
}

// ── 4. Fresnel Zone Calculator ─────────────
function calcFresnel() {
  const freq = parseFloat(document.getElementById('fresnelFreq').value);
  const dist = parseFloat(document.getElementById('fresnelDist').value);
  const obst = parseFloat(document.getElementById('fresnelObstacle').value);
  const container = document.getElementById('fresnelResults');

  if (!freq || !dist || !obst || obst >= dist) {
    container.innerHTML = '<div class="result-row"><span class="result-label">Enter valid distances (obstacle must be less than total distance)</span></div>';
    return;
  }

  // First Fresnel zone radius at distance d1 from TX:
  // r = sqrt( (n * λ * d1 * d2) / (d1 + d2) )
  // where λ = c / f, d2 = total - d1
  const c = 299792458; // speed of light
  const lambda = c / (freq * 1e6); // wavelength in meters
  const d1 = obst;
  const d2 = dist - obst;
  const r1 = Math.sqrt((lambda * d1 * d2) / (d1 + d2));

  // Max radius (at midpoint)
  const rMax = Math.sqrt((lambda * (dist / 2) * (dist / 2)) / dist);

  // 60% clearance
  const clearance60 = r1 * 0.6;
  const clearanceMax60 = rMax * 0.6;

  let html = `
    <div class="result-row">
      <span class="result-label">Wavelength (λ)</span>
      <span class="result-value">${(lambda * 100).toFixed(2)} cm</span>
    </div>
    <div class="result-row">
      <span class="result-label">Fresnel Zone Radius at ${obst}m</span>
      <span class="result-value">${r1.toFixed(2)} m</span>
    </div>
    <div class="result-row">
      <span class="result-label">60% Clearance Required</span>
      <span class="result-value good">${clearance60.toFixed(2)} m</span>
    </div>
    <div class="result-row">
      <span class="result-label">Max Radius (at midpoint)</span>
      <span class="result-value">${rMax.toFixed(2)} m</span>
    </div>
    <div class="result-row">
      <span class="result-label">60% Max Clearance</span>
      <span class="result-value">${clearanceMax60.toFixed(2)} m</span>
    </div>
    <div class="callout" style="margin-top:16px;"><div class="callout-title">Rule of Thumb</div><p>If the Fresnel zone is more than 60% blocked, expect significant signal degradation. Trees, buildings, and terrain within this radius will attenuate your link.</p></div>`;

  container.innerHTML = html;
}

// ── 5. Dipole Antenna Calculator ───────────
function calcDipole() {
  const freq = parseFloat(document.getElementById('dipoleFreq').value);
  const vf = parseFloat(document.getElementById('dipoleVF').value);
  const container = document.getElementById('dipoleResults');

  if (!freq) return;

  const c = 299792458;
  const lambda = (c / (freq * 1e6)) * vf;
  const halfWave = lambda / 2;
  const quarterWave = lambda / 4;
  const fullWave = lambda;

  let html = `
    <div class="result-row">
      <span class="result-label">Full Wavelength</span>
      <span class="result-value">${(fullWave * 100).toFixed(2)} cm / ${(fullWave * 39.3701).toFixed(2)} in</span>
    </div>
    <div class="result-row">
      <span class="result-label">Half-Wave Element (dipole)</span>
      <span class="result-value good">${(halfWave * 100).toFixed(2)} cm / ${(halfWave * 39.3701).toFixed(2)} in</span>
    </div>
    <div class="result-row">
      <span class="result-label">Quarter-Wave Element (monopole)</span>
      <span class="result-value good">${(quarterWave * 100).toFixed(2)} cm / ${(quarterWave * 39.3701).toFixed(2)} in</span>
    </div>
    <div class="result-row">
      <span class="result-label">Velocity Factor</span>
      <span class="result-value">${(vf * 100).toFixed(0)}%</span>
    </div>
    <div class="callout" style="margin-top:16px;"><div class="callout-title">Common VF Values</div><p>Bare wire: 0.95 | RG-58 coax: 0.66 | RG-174: 0.66 | LMR-400: 0.85 | FR-4 PCB: 0.55</p></div>`;

  container.innerHTML = html;
}

// ── 6. Frequency Lookup ────────────────────
function lookupFreq() {
  const freq = parseFloat(document.getElementById('freqLookup').value);
  const container = document.getElementById('freqResults');
  if (!freq) return;

  const matches = [];
  for (const [band, freqs] of Object.entries(FPV_CHANNELS)) {
    freqs.forEach((f, i) => {
      matches.push({ band, ch: i + 1, freq: f, diff: Math.abs(f - freq) });
    });
  }
  matches.sort((a, b) => a.diff - b.diff);
  const top = matches.slice(0, 5);

  let html = '<div class="table-wrap"><table><thead><tr><th>Channel</th><th>Frequency</th><th>Offset</th></tr></thead><tbody>';
  top.forEach((m, i) => {
    const cls = i === 0 ? ' style="color:var(--accent)"' : '';
    html += `<tr><td${cls}>${m.band}${m.ch}</td><td${cls}>${m.freq} MHz</td><td${cls}>${m.diff > 0 ? '±' : ''}${m.diff} MHz</td></tr>`;
  });
  html += '</tbody></table></div>';

  if (top[0].diff === 0) {
    html += `<div class="callout"><div class="callout-title">✓ Exact Match</div><p>${freq} MHz is channel ${top[0].band}${top[0].ch}</p></div>`;
  }

  container.innerHTML = html;
}

// ── 7. VTX Table Generator ─────────────────
const VTX_MODELS = {
  generic: { name: 'Generic', powers: [25, 100, 200, 400, 600], labels: ['25', '100', '200', '400', '600'] },
  rush_tank: { name: 'Rush Tank Ultimate', powers: [25, 100, 400, 800, 1000], labels: ['PIT', '25', '400', '800', 'MAX'] },
  tbs_unify: { name: 'TBS Unify Pro32', powers: [25, 100, 200, 400, 800], labels: ['PIT', '25', '200', '400', '800'] },
  hdzero: { name: 'HDZero Race V3', powers: [25, 100, 200], labels: ['25', '100', '200'] }
};

function generateVtxTable() {
  const modelKey = document.getElementById('vtxModel').value;
  const powerLvl = document.getElementById('vtxPower').value;
  const model = VTX_MODELS[modelKey];

  let powers = [...model.powers];
  let labels = [...model.labels];
  if (powerLvl === 'safe') {
    const safe = powers.map((p, i) => ({ p, l: labels[i] })).filter(x => x.p <= 200);
    powers = safe.map(x => x.p);
    labels = safe.map(x => x.l);
  }

  const bands = [
    { name: 'BOSCAM_A', freqs: FPV_CHANNELS['A'] },
    { name: 'BOSCAM_B', freqs: FPV_CHANNELS['B'] },
    { name: 'BOSCAM_E', freqs: FPV_CHANNELS['E'] },
    { name: 'FATSHARK', freqs: FPV_CHANNELS['F'] },
    { name: 'RACEBAND', freqs: FPV_CHANNELS['R'] },
    { name: 'LOWRACE', freqs: FPV_CHANNELS['L'] }
  ];

  let out = `# VTX Table for ${model.name}\n`;
  out += `# Generated by Forge RF Tools\n`;
  out += `# Paste into Betaflight CLI, then type 'save'\n\n`;
  out += `vtxtable bands ${bands.length}\n`;
  out += `vtxtable channels 8\n`;
  out += `vtxtable powerlevels ${powers.length}\n`;
  out += `vtxtable powervalues ${powers.join(' ')}\n`;
  out += `vtxtable powerlabels ${labels.join(' ')}\n\n`;

  bands.forEach((band, i) => {
    const letter = band.name.charAt(0);
    out += `vtxtable band ${i + 1} ${band.name} ${letter} FACTORY ${band.freqs.join(' ')}\n`;
  });

  out += `\nsave`;

  document.getElementById('vtxOutput').textContent = out;
}

function copyVtxTable() {
  const text = document.getElementById('vtxOutput').textContent;
  navigator.clipboard.writeText(text).then(() => {
    const btn = event.target;
    btn.textContent = 'Copied!';
    btn.style.color = 'var(--accent-green)';
    btn.style.borderColor = 'var(--accent-green)';
    setTimeout(() => {
      btn.textContent = 'Copy';
      btn.style.color = '';
      btn.style.borderColor = '';
    }, 2000);
  });
}

// ── 8. FC Target Matcher ───────────────────
const FC_TARGETS = [
  { pattern: 'STM32F405', target: 'STM32F405', mcu: 'F405', speed: '168 MHz' },
  { pattern: 'STM32F411', target: 'STM32F411', mcu: 'F411', speed: '100 MHz' },
  { pattern: 'STM32F722', target: 'STM32F722', mcu: 'F722', speed: '216 MHz' },
  { pattern: 'STM32F745', target: 'STM32F745', mcu: 'F745', speed: '216 MHz' },
  { pattern: 'STM32H743', target: 'STM32H743', mcu: 'H743', speed: '480 MHz' },
  { pattern: 'STM32H750', target: 'STM32H750', mcu: 'H750', speed: '480 MHz' },
  { pattern: 'STM32H730', target: 'STM32H730', mcu: 'H730', speed: '550 MHz' },
  { pattern: 'STM32G47', target: 'STM32G47x', mcu: 'G47x', speed: '170 MHz' },
  { pattern: 'AT32F435', target: 'AT32F435', mcu: 'AT32F435', speed: '288 MHz' },
];

const KNOWN_BOARDS = [
  { pattern: 'SPEEDYBEEF405', name: 'SpeedyBee F405 V3/V4', mcu: 'F405' },
  { pattern: 'BETAFPVF405', name: 'BetaFPV F405', mcu: 'F405' },
  { pattern: 'MATEKF405', name: 'Matek F405-STD/WSE/CTR', mcu: 'F405' },
  { pattern: 'MATEKH743', name: 'Matek H743-SLIM/WING', mcu: 'H743' },
  { pattern: 'FOXEERF', name: 'Foxeer F7', mcu: 'F722' },
  { pattern: 'JHEF7', name: 'JHE F7 AIO', mcu: 'F722' },
  { pattern: 'KAKUTEH7', name: 'Holybro Kakute H7', mcu: 'H743' },
  { pattern: 'DAKF4', name: 'DAK F4', mcu: 'F405' },
  { pattern: 'CRAZYBEEF4', name: 'CrazyBee F4', mcu: 'F411' },
  { pattern: 'MAMBAF405', name: 'Diatone Mamba F405', mcu: 'F405' },
  { pattern: 'MAMBAH743', name: 'Diatone Mamba H743', mcu: 'H743' },
];

function matchFcTarget() {
  const input = document.getElementById('fcStatusInput').value.toUpperCase();
  const container = document.getElementById('fcResults');

  if (!input.trim()) {
    container.classList.remove('visible');
    return;
  }

  let html = '';
  // Find MCU
  let foundMCU = null;
  for (const fc of FC_TARGETS) {
    if (input.includes(fc.pattern.toUpperCase())) {
      foundMCU = fc;
      break;
    }
  }

  // Find board
  let foundBoard = null;
  for (const board of KNOWN_BOARDS) {
    if (input.includes(board.pattern.toUpperCase())) {
      foundBoard = board;
      break;
    }
  }

  // Extract firmware version
  const fwMatch = input.match(/BTFL\s+(\d+\.\d+\.\d+)/i) || input.match(/(\d+\.\d+\.\d+)\s+BETAFLIGHT/i);

  if (foundMCU || foundBoard || fwMatch) {
    if (foundBoard) {
      html += `<div class="result-row"><span class="result-label">Board Target</span><span class="result-value good">${foundBoard.name}</span></div>`;
    }
    if (foundMCU) {
      html += `<div class="result-row"><span class="result-label">MCU</span><span class="result-value">${foundMCU.target} (${foundMCU.speed})</span></div>`;
    }
    if (fwMatch) {
      html += `<div class="result-row"><span class="result-label">Firmware Version</span><span class="result-value">${fwMatch[1]}</span></div>`;
    }
  } else {
    html = '<div class="result-row"><span class="result-label" style="color:var(--accent-amber)">Could not detect FC target. Paste the full \'status\' CLI output.</span></div>';
  }

  container.innerHTML = html;
  container.classList.add('visible');
}

// ── 10. SWR & Return Loss Converter ────────
function calcSWR(source) {
  const swrIn = document.getElementById('swrInput');
  const rlIn = document.getElementById('rlInput');
  const results = document.getElementById('swrResults');

  let swr, rl, gamma;

  if (source === 'swr') {
    swr = parseFloat(swrIn.value);
    if (swr < 1) swr = 1;
    gamma = (swr - 1) / (swr + 1);
    rl = -20 * Math.log10(gamma);
    rlIn.value = rl.toFixed(1);
  } else {
    rl = parseFloat(rlIn.value);
    gamma = Math.pow(10, -rl / 20);
    swr = (1 + gamma) / (1 - gamma);
    swrIn.value = swr.toFixed(2);
  }

  const reflectedPower = Math.pow(gamma, 2) * 100;
  const transLoss = -10 * Math.log10(1 - Math.pow(gamma, 2));

  results.innerHTML = `
    <div class="result-row"><span class="result-label">Reflection Coefficient (Γ)</span><span class="result-value">${gamma.toFixed(3)}</span></div>
    <div class="result-row"><span class="result-label">Reflected Power</span><span class="result-value ${reflectedPower > 10 ? 'warn' : 'good'}">${reflectedPower.toFixed(2)}%</span></div>
    <div class="result-row"><span class="result-label">Mismatch Loss</span><span class="result-value">${transLoss.toFixed(3)} dB</span></div>
    <div class="callout ${swr > 2 ? 'danger' : swr > 1.5 ? 'warn' : ''}" style="margin-top:12px;">
      <div class="callout-title">Antenna Status: ${swr > 3 ? 'CRITICAL' : swr > 2 ? 'POOR' : swr > 1.5 ? 'FAIR' : 'EXCELLENT'}</div>
      <p>${swr > 2 ? 'High SWR detected. Risk of VTX damage and significant range loss.' : 'Antenna system is healthy and efficient.'}</p>
    </div>
  `;
}

// ── 11. Antenna Downtilt Calculator ────────
function calcDowntilt() {
  const h = parseFloat(document.getElementById('tiltAlt').value);
  const d = parseFloat(document.getElementById('tiltDist').value);
  const results = document.getElementById('tiltResults');

  if (!h || !d) return;

  const angleRad = Math.atan(h / d);
  const angleDeg = angleRad * (180 / Math.PI);

  results.innerHTML = `
    <div class="result-row"><span class="result-label">Optimal Downtilt Angle</span><span class="result-value good">${angleDeg.toFixed(1)}°</span></div>
    <div class="result-row"><span class="result-label">Slant Range</span><span class="result-value">${Math.sqrt(h*h + d*d).toFixed(1)} m</span></div>
    <div class="callout" style="margin-top:12px;">
      <div class="callout-title">Alignment Tip</div>
      <p>Aim your directional antenna ${angleDeg.toFixed(1)}° <strong>above the horizon</strong> to point directly at the craft at its current position.</p>
    </div>
  `;
}

// ── 12. EIRP Budget Calculator ─────────────
function calcEirp() {
  const p = parseFloat(document.getElementById('eirpTx').value);
  const l = parseFloat(document.getElementById('eirpLoss').value);
  const g = parseFloat(document.getElementById('eirpGain').value);
  const results = document.getElementById('eirpResults');

  const eirpDbm = p - l + g;
  const eirpMw = Math.pow(10, eirpDbm / 10);

  results.innerHTML = `
    <div class="result-row"><span class="result-label">Total EIRP</span><span class="result-value good">${eirpDbm.toFixed(1)} dBm</span></div>
    <div class="result-row"><span class="result-label">Equivalent Radiated Power</span><span class="result-value">${eirpMw.toFixed(0)} mW</span></div>
    <div class="callout ${eirpMw > 1000 ? 'warn' : ''}" style="margin-top:12px;">
      <div class="callout-title">Legal Note</div>
      <p>${eirpMw > 1000 ? '⚠ High power detected. Verify local ISM band regulations (e.g., FCC/CE limits).' : 'Power levels are typical for standard drone operations.'}</p>
    </div>
  `;
}

// ── 13. Polarization Loss ──────────────────
function calcPolarization() {
  const angle = parseFloat(document.getElementById('polarAngle').value);
  document.getElementById('polarAngleVal').textContent = angle + '°';
  const results = document.getElementById('polarResults');

  // Loss (dB) = 20 * log10(cos(theta))
  // We use max(cos, 0.001) to avoid log of zero
  const cosTheta = Math.cos(angle * (Math.PI / 180));
  const loss = angle === 90 ? -60 : 20 * Math.log10(Math.abs(cosTheta));
  
  const intensity = Math.pow(cosTheta, 2) * 100;

  results.innerHTML = `
    <div class="result-row"><span class="result-label">Signal Loss</span><span class="result-value ${angle > 45 ? 'warn' : 'good'}">${loss.toFixed(1)} dB</span></div>
    <div class="result-row"><span class="result-label">Remaining Intensity</span><span class="result-value">${intensity.toFixed(1)}%</span></div>
    <div class="callout ${angle > 60 ? 'danger' : ''}" style="margin-top:12px;">
      <div class="callout-title">${angle > 80 ? 'CROSS-POLARIZATION' : 'Polarization Misalignment'}</div>
      <p>${angle > 80 ? 'Signal will be almost entirely lost. Avoid 90° misalignment between TX and RX antennas.' : 'Antenna alignment is critical for long-range and penetration.'}</p>
    </div>
  `;
}

// ── 14. DGCA Airspace Map Implementation ──
let airspaceMap;
const AIRPORTS = [
  { name: 'Indira Gandhi Int\'l (DEL)', lat: 28.5562, lon: 77.1000 },
  { name: 'Chhatrapati Shivaji (BOM)', lat: 19.0896, lon: 72.8656 },
  { name: 'Kempegowda Int\'l (BLR)', lat: 13.1986, lon: 77.7066 },
  { name: 'Rajiv Gandhi Int\'l (HYD)', lat: 17.2403, lon: 78.4294 },
  { name: 'Chennai Int\'l (MAA)', lat: 12.9941, lon: 80.1709 },
  { name: 'Netaji Subhash (CCU)', lat: 22.6547, lon: 88.4467 },
  { name: 'Hindustan (HAL) Airport', lat: 12.9515, lon: 77.6682 },
  { name: 'Pune Airport (PNQ)', lat: 18.5821, lon: 73.9197 }
];

function initAirspaceMap() {
  const mapEl = document.getElementById('map');
  if (!mapEl) return;

  // Initialize Map centered on India
  airspaceMap = L.map('map').setView([20.5937, 78.9629], 5);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
  }).addTo(airspaceMap);

  // Add Airport Buffers (Simulated Red/Yellow Zones)
  AIRPORTS.forEach(ap => {
    // Red Zone (5km)
    L.circle([ap.lat, ap.lon], {
      color: '#ff3366',
      fillColor: '#ff3366',
      fillOpacity: 0.3,
      radius: 5000 
    }).addTo(airspaceMap).bindPopup(`<b>${ap.name}</b><br>RED ZONE: 5km No-Fly`);

    // Yellow Zone (12km)
    L.circle([ap.lat, ap.lon], {
      color: '#ffaa00',
      fillColor: '#ffaa00',
      fillOpacity: 0.1,
      radius: 12000
    }).addTo(airspaceMap).bindPopup(`<b>${ap.name}</b><br>YELLOW ZONE: Restricted`);
  });

  // Map Click Listener
  airspaceMap.on('click', (e) => {
    updateAirspaceStatus(e.latlng.lat, e.latlng.lng);
  });
}

function updateAirspaceStatus(lat, lon) {
  const statusBox = document.getElementById('mapStatus');
  let zone = 'GREEN';
  let zoneColor = 'var(--accent-green)';
  let message = 'GREEN ZONE: Nano and Micro drones can fly up to 400ft without prior permission (after flight notification).';
  let nearestAP = null;
  let minDist = Infinity;

  // Find distance to nearest airport
  AIRPORTS.forEach(ap => {
    const dist = getDistance(lat, lon, ap.lat, ap.lon);
    if (dist < minDist) {
      minDist = dist;
      nearestAP = ap;
    }
  });

  if (minDist <= 5) {
    zone = 'RED (NO-FLY)';
    zoneColor = 'var(--accent-alt)';
    message = `PROHIBITED: You are within 5km of ${nearestAP.name}. Takeoff is disabled in Digital Sky.`;
  } else if (minDist <= 12) {
    zone = 'YELLOW (CONTROLLED)';
    zoneColor = 'var(--accent-amber)';
    message = `RESTRICTED: You are within 12km of ${nearestAP.name}. ATC permission required via Digital Sky.`;
  }

  statusBox.innerHTML = `
    <div style="font-family:var(--font-mono);font-size:0.95rem;">
      <div style="margin-bottom:8px;">
        <span style="color:var(--text-muted)">Coordinates:</span> 
        <span style="color:var(--accent)">${lat.toFixed(4)}, ${lon.toFixed(4)}</span>
      </div>
      <div style="margin-bottom:12px;">
        <span style="color:var(--text-muted)">Zone Status:</span> 
        <strong style="color:${zoneColor}">${zone}</strong>
      </div>
      <p style="font-size:0.85rem;color:var(--text-dim);line-height:1.4;border-top:1px solid var(--border);padding-top:12px;">
        ${message}
      </p>
    </div>
  `;
}

// Haversine formula for distance
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// ── Init on load ───────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  updateChannelPlanner();
  calcHarmonics();
  calcRange();
  calcFresnel();
  calcDipole();
  lookupFreq();
  generateVtxTable();
  calcSWR('swr');
  calcDowntilt();
  calcEirp();
  calcPolarization();
  initAirspaceMap();
});
