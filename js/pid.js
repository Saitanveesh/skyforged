/* ── Tactical Hangar Diagnostic Logic (PID) ──────────────── */

let currentStep = 1;

function nextStep(step) {
  document.getElementById(`pane${currentStep}`).classList.remove('active');
  document.getElementById(`step${currentStep}`).classList.remove('active');
  document.getElementById(`step${currentStep}`).classList.add('complete');

  currentStep = step;
  document.getElementById(`pane${currentStep}`).classList.add('active');
  document.getElementById(`step${currentStep}`).classList.add('active');

  if (currentStep === 2) initEQ();
}

/* ── Phase 1: Structural X-Ray ──────────────── */

function pingComponent(name) {
  const report = document.getElementById('pingReport');
  const analysis = document.getElementById('pingAnalysis');
  const text = document.getElementById('pingText');
  
  report.innerText = `SCANNING: ${name.toUpperCase()}...`;
  
  setTimeout(() => {
    report.innerText = `STATUS: SCAN_COMPLETE`;
    analysis.style.display = 'block';
    
    if (name.includes('Arm')) {
      text.innerHTML = `<strong>Result:</strong> High-frequency resonance detected in ${name}. Check for loose motor screws or arm-end delamination.`;
    } else if (name.includes('Stack')) {
      text.innerHTML = `<strong>Result:</strong> Noise floor @ 120Hz detected on Gyro. Recommend soft-mounting the FC or checking for wire-rub.`;
    } else {
      text.innerHTML = `<strong>Result:</strong> ${name} is structurally sound. Ready for filter calibration.`;
    }
  }, 800);
}

/* ── Phase 2: Harmonic Suppression (EQ Mode) ──────────────── */

let eqCanvas, eqCtx;
function initEQ() {
  eqCanvas = document.getElementById('eqCanvas');
  if (!eqCanvas) return;
  eqCtx = eqCanvas.getContext('2d');
  updateEQ();
}

function updateEQ() {
  if (!eqCtx) return;
  const n1 = document.getElementById('notch1').value;
  const n2 = document.getElementById('notch2').value;
  
  drawEQ(n1, n2);
}

function drawEQ(n1, n2) {
  const w = eqCanvas.width;
  const h = eqCanvas.height;
  eqCtx.clearRect(0, 0, w, h);
  
  // Background Grid
  eqCtx.strokeStyle = '#111';
  eqCtx.beginPath();
  for(let i=0; i<w; i+=50) { eqCtx.moveTo(i, 0); eqCtx.lineTo(i, h); }
  eqCtx.stroke();

  // Noise Floor (Red Heat)
  eqCtx.fillStyle = 'rgba(255, 50, 50, 0.15)';
  eqCtx.beginPath();
  eqCtx.moveTo(0, h);
  for (let i = 0; i <= w; i++) {
    const freq = (i / w) * 500;
    let y = h - (Math.random() * 20 + 20);
    // Fixed Peaks
    if (Math.abs(freq - 280) < 30) y -= 100 * Math.exp(-Math.pow(freq - 280, 2) / 200);
    if (Math.abs(freq - 400) < 30) y -= 80 * Math.exp(-Math.pow(freq - 400, 2) / 200);
    eqCtx.lineTo(i, y);
  }
  eqCtx.lineTo(w, h);
  eqCtx.fill();

  // Filter Line (Green Suppression)
  eqCtx.strokeStyle = 'var(--accent)';
  eqCtx.lineWidth = 3;
  eqCtx.beginPath();
  eqCtx.moveTo(0, h - 140);
  for (let i = 0; i <= w; i++) {
    const freq = (i / w) * 500;
    let atten = 1.0;
    // Notch 1
    if (Math.abs(freq - n1) < 20) atten *= 0.1;
    // Notch 2
    if (Math.abs(freq - n2) < 20) atten *= 0.1;
    
    eqCtx.lineTo(i, h - (140 * atten + 10));
  }
  eqCtx.stroke();
}

/* ── Phase 3: Response Prototyper ──────────────── */

function updateResponseSim() {
  const val = document.getElementById('confidenceSlider').value;
  const display = document.getElementById('latencyDisplay');
  const verdict = document.getElementById('simVerdict');
  
  const latency = (3.5 - (val * 0.25)).toFixed(1);
  display.innerText = `${latency}ms Delay`;
  
  if (val > 8) {
    verdict.innerHTML = `<p>Current: <strong>Extreme Authority</strong>. Recommended for sub-250g racing builds only. High risk of hot motors.</p>`;
    verdict.className = 'callout warn';
  } else if (val < 4) {
    verdict.innerHTML = `<p>Current: <strong>Safe/Mushy</strong>. Best for cinematic long-range missions where prop-wash isn't a concern.</p>`;
    verdict.className = 'callout info';
  } else {
    verdict.innerHTML = `<p>Current: <strong>Optimal Tactical Balance</strong>. Perfect for standard 5" freestyle and tactical ops.</p>`;
    verdict.className = 'callout good';
  }
}

/* ── Phase 4: Mission Deployment ──────────────── */

function exportPreset(type) {
  const status = document.getElementById('exportStatus');
  status.style.display = 'block';
  status.className = 'result-box visible';
  
  const presets = {
    acro: `set p_pitch = 55\nset d_pitch = 45\nset feedforward_weight = 120\n# TACTICAL ACRO LOADED`,
    cinematic: `set p_pitch = 42\nset d_pitch = 50\nset iterm_relax = 15\n# SMOOTH DEPTH LOADED`,
    longrange: `set p_pitch = 38\nset d_pitch = 35\nset vbat_sag_compensation = 100\n# EFFICIENCY LOADED`
  };
  
  status.innerHTML = `<pre style="font-size:0.75rem; color:var(--accent);"># SKYFORGED PRESET: ${type.toUpperCase()}\n${presets[type]}</pre>`;
}
