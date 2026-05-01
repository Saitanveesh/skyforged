/* ══════════════════════════════════════════════════════════════
   Anatomy of FPV — Scrollytelling Engine
   SkyForged / Sai Tanveesh
════════════════════════════════════════════════════════════════ */

/* ─── Component Data ─── */
const PARTS = {
  frame: {
    tag: 'STRUCTURAL EXOSKELETON',
    title: 'Carbon Fiber Frame',
    desc: 'The carbon fiber monocoque chassis is the tactical foundation of the build. Machined from T700 carbon, the arms are designed for maximum torsional rigidity under 200A+ of electrical load while surviving 150km/h crashes.',
    specs: [
      { key: 'Material', val: 'T700 Carbon Fiber' },
      { key: 'Arm Thickness', val: '4mm (Bottom) / 3mm (Top)' },
      { key: 'Mount Pattern', val: '30.5×30.5mm' },
      { key: 'Weight', val: '~65g (Bare)' },
      { key: 'Design', val: 'Deadcat / True-X' },
    ]
  },
  battery: {
    tag: 'ELECTROLYTE STORAGE',
    title: '6S LiPo Fuel Cell',
    desc: 'The lithium polymer battery is the powerplant of the system. A 6S configuration provides 22.2V nominal, enabling high-KV motors to spin at peak efficiency. Burst discharge rates up to 200C deliver instantaneous current surges during punch-outs.',
    specs: [
      { key: 'Cell Config', val: '6S (22.2V Nominal)' },
      { key: 'Capacity', val: '1300mAh' },
      { key: 'Discharge Rate', val: '100C / 200C Burst' },
      { key: 'Connector', val: 'XT60' },
      { key: 'Weight', val: '~180g' },
    ]
  },
  stack: {
    tag: 'CENTRAL PROCESSING NODE',
    title: 'FC + ESC Stack',
    desc: 'The "stack" is the neural core of the drone. The Flight Controller (FC) runs Betaflight at 8kHz loop rate, fusing IMU data from the ICM-42688P gyro. The 4-in-1 ESC below it runs BLHeli_32 with RPM telemetry, enabling closed-loop filtering that eliminates motor noise.',
    specs: [
      { key: 'FC SoC', val: 'STM32 H743 (480MHz)' },
      { key: 'Gyro', val: 'ICM-42688P' },
      { key: 'ESC Rating', val: '60A Cont. / 80A Burst' },
      { key: 'Protocol', val: 'DSHOT 600 / BLHeli_32' },
      { key: 'Loop Rate', val: '8kHz / 4kHz' },
    ]
  },
  motors: {
    tag: 'BRUSHLESS ACTUATORS',
    title: 'Quad Brushless Motors',
    desc: 'Four multi-pole neodymium magnet motors translate electrical current into rotational force. Motor direction alternates CW/CCW per arm to cancel angular momentum (gyroscopic drift). High KV (2450KV+) is tuned for 6S to generate 1.2kg+ of thrust per unit.',
    specs: [
      { key: 'Stator', val: '2306 (23mm × 6mm)' },
      { key: 'KV Rating', val: '2450KV (6S) / 2550KV (5S)' },
      { key: 'Max Thrust', val: '1,280g @ 100% (Single)' },
      { key: 'Magnet Grade', val: 'N52SH Neodymium' },
      { key: 'Max Current', val: '38A' },
    ]
  },
  camera: {
    tag: 'OPTICAL & RF LINK',
    title: 'Camera + VTX',
    desc: 'The FPV camera captures wide-FOV (170°) footage at 1200TVL with night-vision capable sensors. Signal is transmitted via the Video Transmitter (VTX) at up to 1200mW on 5.8GHz to the pilot\'s goggles, achieving sub-10ms glass-to-glass latency.',
    specs: [
      { key: 'Camera', val: 'Caddx Ratel 2 / 1200TVL' },
      { key: 'FOV', val: '170° Wide' },
      { key: 'VTX Power', val: '25mW – 1200mW (Selectable)' },
      { key: 'Frequency', val: '5.8GHz (40 Ch)' },
      { key: 'Latency', val: '<10ms Glass-to-Glass' },
    ]
  },
  props: {
    tag: 'THRUST SURFACES',
    title: 'Propellers',
    desc: 'Polycarbonate bi-blade props convert motor RPM into aerodynamic thrust via Bernoulli lift and Newton\'s reaction force. Pitch determines speed-vs-efficiency — a 4.3" pitch on a 5" prop aggressively accelerates air rearward, maximizing top speed at the cost of motor temperature.',
    specs: [
      { key: 'Diameter', val: '5.1" (130mm)' },
      { key: 'Pitch', val: '4.3"' },
      { key: 'Blades', val: '2 (Bi-Blade)' },
      { key: 'Material', val: 'T700 Polycarbonate' },
      { key: 'Max RPM', val: '~38,000 RPM' },
    ]
  }
};

/* ─── Layer & Scroll Config ─── */
// Z offset (px) each layer travels upward as scroll progresses 0→1
const EXPLODE_CONFIG = [
  { id: 'layer-frame',   key: 'frame',   zMax: 0,    yMax: 0    }, // stays
  { id: 'layer-battery', key: 'battery', zMax: -180, yMax: 80   }, // goes down
  { id: 'layer-stack',   key: 'stack',   zMax: 60,   yMax: 0    }, // slight up
  { id: 'layer-motors',  key: 'motors',  zMax: 140,  yMax: -20  }, // up more
  { id: 'layer-camera',  key: 'camera',  zMax: 220,  yMax: -40  }, // higher
  { id: 'layer-props',   key: 'props',   zMax: 320,  yMax: -60  }, // highest
];

const PHASE_NAMES = [
  { label: 'STRUCTURAL BASE', name: 'Carbon Frame' },
  { label: 'ENERGY SOURCE',   name: '6S LiPo Battery' },
  { label: 'BRAIN + MUSCLE',  name: 'FC / ESC Stack' },
  { label: 'PROPULSION',      name: 'Brushless Motors' },
  { label: 'VISION SYSTEM',   name: 'Camera + VTX' },
  { label: 'THRUST SURFACES', name: 'Propellers' },
];

let activePart = null;
let currentPhaseIdx = 0;

/* ─── Scroll Engine ─── */
window.addEventListener('scroll', onScroll, { passive: true });

function onScroll() {
  const wrapper = document.querySelector('.anatomy-wrapper');
  if (!wrapper) return;

  const wrapperRect = wrapper.getBoundingClientRect();
  const totalTravel  = wrapper.offsetHeight - window.innerHeight;
  const scrolled     = Math.min(Math.max(-wrapperRect.top, 0), totalTravel);
  const t            = scrolled / totalTravel; // 0 → 1

  // Hide scroll hint after 5%
  const hint = document.getElementById('scrollHint');
  if (hint) hint.classList.toggle('hidden', t > 0.05);

  // Gentle tilt of whole stage
  const stage = document.getElementById('droneStage');
  if (stage) {
    const tiltX = 30 - t * 15; // 30° → 15°
    const tiltZ = 20 + t * 10; // 20° → 30°
    stage.style.transform = `rotateX(${tiltX}deg) rotateZ(${tiltZ}deg)`;
  }

  // Explode each layer
  EXPLODE_CONFIG.forEach((cfg, i) => {
    const el = document.getElementById(cfg.id);
    if (!el) return;

    // Stagger: each part starts separating at different scroll %
    const staggerStart = (i / EXPLODE_CONFIG.length) * 0.6;
    const staggerT     = Math.min(Math.max((t - staggerStart) / 0.4, 0), 1);
    const easedT       = easeOutCubic(staggerT);

    const z   = cfg.zMax * easedT;
    const y   = cfg.yMax * easedT;
    const op  = i === 0 ? 1 : 0.3 + 0.7 * easedT;

    el.style.transform = `translateZ(${z}px) translateY(${y}px)`;
    el.style.opacity   = op;
  });

  // Update active phase label
  const phaseIdx = Math.min(Math.floor(t * EXPLODE_CONFIG.length), EXPLODE_CONFIG.length - 1);
  if (phaseIdx !== currentPhaseIdx) {
    currentPhaseIdx = phaseIdx;
    updatePhaseUI(phaseIdx);
  }
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

/* ─── Phase UI ─── */
function updatePhaseUI(idx) {
  const labelEl = document.getElementById('phaseLabel');
  const nameEl  = document.getElementById('phaseName');
  if (labelEl) labelEl.innerText = PHASE_NAMES[idx].label;
  if (nameEl)  nameEl.innerText  = PHASE_NAMES[idx].name;

  // Sidebar progress
  document.querySelectorAll('.prog-item').forEach((el, i) => {
    el.classList.toggle('active', i === idx);
  });
}

/* ─── Info Panel ─── */
function openPanel(key) {
  const data  = PARTS[key];
  if (!data) return;

  document.getElementById('panelTag').innerText   = data.tag;
  document.getElementById('panelTitle').innerText = data.title;
  document.getElementById('panelDesc').innerText  = data.desc;

  const specsEl = document.getElementById('panelSpecs');
  specsEl.innerHTML = data.specs.map(s => `
    <div class="spec-row">
      <span class="spec-key">${s.key}</span>
      <span class="spec-val">${s.val}</span>
    </div>
  `).join('');

  // Flash the layer
  const layerEl = document.getElementById(`layer-${key}`);
  if (layerEl) {
    layerEl.classList.add('flashed');
    setTimeout(() => layerEl.classList.remove('flashed'), 800);
  }

  activePart = key;
  document.getElementById('infoPanel').classList.add('visible');
}

function closePanel() {
  document.getElementById('infoPanel').classList.remove('visible');
  activePart = null;
}

/* ─── Sidebar click focus ─── */
function focusPart(idx) {
  // Scroll to approximate position for that part
  const wrapper = document.querySelector('.anatomy-wrapper');
  if (!wrapper) return;
  const totalTravel = wrapper.offsetHeight - window.innerHeight;
  const targetT     = (idx / EXPLODE_CONFIG.length) * 0.9;
  window.scrollTo({ top: totalTravel * targetT, behavior: 'smooth' });
  setTimeout(() => openPanel(EXPLODE_CONFIG[idx].key), 600);
}

/* ─── Init ─── */
document.addEventListener('DOMContentLoaded', () => {
  // Set initial state
  const stage = document.getElementById('droneStage');
  if (stage) stage.style.transform = 'rotateX(30deg) rotateZ(20deg)';
  EXPLODE_CONFIG.forEach(cfg => {
    const el = document.getElementById(cfg.id);
    if (el) { el.style.transform = 'translateZ(0px)'; el.style.opacity = '1'; }
  });
  updatePhaseUI(0);
});
