/* ============================================
 FORGE — Model Builder
 Slot-based build planner with compatibility
 ============================================ */

// COMPONENTS is now loaded from js/database.js as a global constant.

const SLOT_GROUPS = {
  'Airframe & Propulsion': ['frames__racing_', 'frames__cinema_', 'frames__long_range_', 'motors__racing_', 'motors__long_range_', 'motors__industrial_', 'propellers__racing_', 'propellers__cinema_'],
  'Control & Power': ['fc__aio_', 'fc__stackable_', 'esc__4_in_in_', 'esc__single_', 'batteries__lipo_', 'batteries__li_ion_', 'pdb_bec'],
  'RF & Links': ['vtx__analog_', 'vtx__digital_', 'receivers__elrs_', 'receivers__crsf_', 'antennas__omni_', 'antennas__directional_'],
  'Vision & Payload': ['fpv_cam__analog_', 'fpv_cam__digital_', 'payload__high_res_', 'payload__thermal_', 'gimbals'],
  'Intelligence & Safety': ['gps_gnss', 'rtk_modules', 'companion_computers', 'lidar_depth', 'sonar', 'safety_systems']
};

const SLOT_LABELS = {
  frames__racing_: 'Racing Frame', frames__cinema_: 'Cinema Frame', frames__long_range_: 'Long Range Frame',
  fc__aio_: 'AIO Flight Controller', fc__stackable_: 'Stackable FC', 
  esc__4_in_in_: '4-in-1 ESC', esc__single_: 'Single ESC',
  motors__racing_: 'Racing Motors (x4)', motors__long_range_: 'LR Motors (x4)', motors__industrial_: 'Industrial Motors',
  propellers__racing_: 'Racing Props', propellers__cinema_: 'Cinema Props',
  batteries__lipo_: 'LiPo Battery', batteries__li_ion_: 'Li-ion Battery',
  vtx__analog_: 'Analog VTX', vtx__digital_: 'Digital Air Unit',
  fpv_cam__analog_: 'Analog FPV Cam', fpv_cam__digital_: 'Digital FPV Cam',
  payload__high_res_: 'High-Res Payload', payload__thermal_: 'Thermal Camera',
  receivers__elrs_: 'ELRS Receiver', receivers__crsf_: 'CRSF Receiver',
  gps_gnss: 'GPS/GNSS Module', rtk_modules: 'RTK Module',
  antennas__omni_: 'Omni Antenna', antennas__directional_: 'Patch Antenna',
  companion_computers: 'Companion Computer', lidar_depth: 'Lidar Sensor',
  sonar: 'Sonar Sensor', gimbals: 'Camera Gimbal',
  pdb_bec: 'PDB / BEC', safety_systems: 'Safety (Buzzer/Parachute)'
};

const SLOT_ORDER = Object.keys(SLOT_LABELS);

let build = {};
let activeSlot = null;

function renderSlots() {
  const container = document.getElementById('buildSlots');
  container.innerHTML = Object.entries(SLOT_GROUPS).map(([groupName, slots]) => `
    <div class="slot-group">
      <h3 class="slot-group-title">${groupName}</h3>
      <div class="slot-group-grid">
        ${slots.map(slot => {
          const comp = build[slot];
          const filled = comp ? 'filled' : '';
          const multiplier = slot.includes('motors') || slot.includes('propellers') ? 4 : 1;
          return `
            <div class="build-slot ${filled}" onclick="openPicker('${slot}')">
              <div class="slot-header">
                <span class="slot-label">${SLOT_LABELS[slot]}</span>
                ${comp ? `<span class="remove-btn" onclick="event.stopPropagation();removeComponent('${slot}')">✕</span>` : ''}
              </div>
              ${comp ? `
                <div class="slot-component">${comp.name}</div>
                <div class="slot-meta">
                  ${comp.weight ? `${comp.weight * multiplier}g` : ''} 
                  ${comp.price ? `· ₹${(comp.price * multiplier).toLocaleString('en-IN')}` : ''}
                </div>
              ` : `
                <div class="slot-component placeholder">Select Part</div>
              `}
            </div>`;
        }).join('')}
      </div>
    </div>
  `).join('');
  updateSummary();
}

function openPicker(slotId) {
  activeSlot = slotId;
  const overlay = document.getElementById('pickerOverlay');
  const input = document.getElementById('pickerSearch');
  if (!overlay || !input) return;

  overlay.classList.add('active');
  input.value = '';
  // Force a clean render with all items for the slot
  renderPickerResults('');
  
  setTimeout(() => input.focus(), 50);

  // Re-bind events to ensure they use the current closure/data
  input.oninput = () => renderPickerResults(input.value.toLowerCase());
  overlay.onclick = (e) => { if (e.target.id === 'pickerOverlay') closePicker(); };
  document.onkeydown = (e) => { if (e.key === 'Escape') closePicker(); };
}

function closePicker() {
  document.getElementById('pickerOverlay').classList.remove('active');
  activeSlot = null;
}

function renderPickerResults(query) {
  const results = document.getElementById('pickerResults');
  if (!results) return;

  const categoryData = COMPONENTS[activeSlot] || [];
  const q = (query || '').toLowerCase().trim();

  // Show all if query is empty, else filter
  let filtered = q === '' 
    ? categoryData 
    : categoryData.filter(c => 
        (c.name || '').toLowerCase().includes(q) || 
        (c.brand || '').toLowerCase().includes(q)
      );

  // Limit for performance
  if (q === '') filtered = filtered.slice(0, 100);

  if (filtered.length === 0) {
    results.innerHTML = `<div style="padding:40px;text-align:center;color:var(--text-muted);font-family:var(--font-mono);font-size:0.8rem;">No ${activeSlot.replace(/_/g, ' ')} found matching "${q}"</div>`;
    return;
  }

  results.innerHTML = filtered.map(c => {
    const multiplier = activeSlot.includes('motors') || activeSlot.includes('propellers') ? 4 : 1;
    const priceINR = c.price ? `₹${(c.price * multiplier).toLocaleString('en-IN')}` : '';
    
    const specs = [
      c.weight ? `${c.weight * multiplier}g` : '',
      priceINR,
      c.voltage || '',
      c.kv || '',
      c.capacity || ''
    ].filter(Boolean).join(' · ');
    return `
      <div class="search-result-item" onclick="selectComponent('${c.id}')">
        <div class="search-result-title">${c.name}</div>
        <div class="search-result-preview">${specs}</div>
      </div>`;
  }).join('');
}

function selectComponent(id) {
  const comp = COMPONENTS[activeSlot].find(c => c.id === id);
  if (comp) {
    build[activeSlot] = { ...comp };
    closePicker();
    renderSlots();
  }
}

function removeComponent(slot) {
  delete build[slot];
  renderSlots();
}

function resetBuild() {
  build = {};
  renderSlots();
}

function updateSummary() {
  const filled = Object.keys(build).filter(k => build[k]).length;
  document.getElementById('sumComponents').textContent = `${filled} / ${SLOT_ORDER.length}`;

  let totalWeight = 0;
  let totalCost = 0;
  SLOT_ORDER.forEach(slot => {
    const c = build[slot];
    if (!c) return;
    const mult = (slot.includes('motors__') || slot.includes('propellers__')) ? 4 : 1;
    totalWeight += (c.weight || 0) * mult;
    totalCost += (c.price || 0) * mult;
  });

  document.getElementById('sumWeight').textContent = totalWeight + ' g';
  document.getElementById('sumCost').textContent = '₹' + totalCost.toLocaleString('en-IN');

  const batt = build.batteries__lipo_ || build.batteries__li_ion_;
  document.getElementById('sumVoltage').textContent = batt ? (batt.voltage || '—') : '—';

  runChecks();
}

function runChecks() {
  const checks = [];

  // 1. Core Component Mapping
  const fc = build.fc__aio_ || build.fc__stackable_;
  const esc = build.esc__4_in_in_ || build.esc__single_ || build.fc__aio_; // AIO includes ESC
  const frame = build.frames__racing_ || build.frames__cinema_ || build.frames__long_range_;
  const motors = build.motors__racing_ || build.motors__long_range_ || build.motors__industrial_;
  const props = build.propellers__racing_ || build.propellers__cinema_;
  const battery = build.batteries__lipo_ || build.batteries__li_ion_;
  const receiver = build.receivers__elrs_ || build.receivers__crsf_;
  const vtx = build.vtx__analog_ || build.vtx__digital_;
  const gps = build.gps__gnss_ || build.rtk__modules_;

  // 1. Mounting pattern
  if (fc?.mount && frame?.mount) {
    const compatible = frame.mount.includes(fc.mount) || 
                       (frame.mount.includes('30.5') && fc.mount.includes('30.5')) ||
                       (frame.mount.includes('20') && fc.mount.includes('20'));
    checks.push({
      pass: compatible,
      text: `FC mount (${fc.mount}) ${compatible ? 'fits' : 'conflicts with'} frame (${frame.mount})`
    });
  }

  // 2. Voltage compatibility
  if (battery?.voltage && (fc?.voltage || esc?.voltage)) {
    const battS = battery.voltage.includes('6S') ? 6 : battery.voltage.includes('4S') ? 4 : 0;
    const fcMax = (fc?.voltage || '').includes('6S') ? 6 : (fc?.voltage || '').includes('4S') ? 4 : 8;
    const escMax = (esc?.voltage || '').includes('6S') ? 6 : (esc?.voltage || '').includes('4S') ? 4 : 8;
    
    const fcPass = battS <= fcMax;
    const escPass = battS <= escMax;
    
    if (!fcPass) checks.push({ pass: false, text: `Battery (${battery.voltage}) exceeds FC limit` });
    if (!escPass) checks.push({ pass: false, text: `Battery (${battery.voltage}) exceeds ESC limit` });
    if (fcPass && escPass) checks.push({ pass: true, text: `Voltage levels nominal (${battery.voltage})` });
  }

  // 3. Prop/frame size match
  if (props?.size && frame?.size) {
    const pass = frame.size.includes(props.size) || props.size === frame.size;
    checks.push({ pass, text: `Prop size (${props.size}) ${pass ? 'clears' : 'exceeds'} frame arms (${frame.size})` });
  }

  // 4. UART count
  if (fc) {
    const uarts = fc.uarts || 4;
    let needed = 1; // USB/Config
    if (receiver) needed++;
    if (gps) needed++;
    if (vtx) needed++;
    if (esc && !build.fc__aio_) needed++; // Telemetry
    
    const pass = uarts >= needed;
    checks.push({ pass, text: `UARTs: ${uarts} avail, ${needed} required` });
  }

  // 5. Weight Check (AUW)
  let auw = 0;
  SLOT_ORDER.forEach(s => {
    if (build[s]) auw += (build[s].weight || 0) * ((s.includes('motors__') || s.includes('propellers__')) ? 4 : 1);
  });
  
  if (auw > 0) {
    const isHeavy = auw > 1200;
    checks.push({ pass: !isHeavy, text: `AUW: ${auw}g — ${isHeavy ? 'High wing load' : 'Nominal weight'}` });
  }

  const container = document.getElementById('checkList');
  if (checks.length === 0) {
    container.innerHTML = '<div style="font-family:var(--font-mono);font-size:0.75rem;color:var(--text-muted);padding:8px;">Add components to analyze build</div>';
    return;
  }

  container.innerHTML = checks.map(c => `
    <div class="check-item ${c.pass ? 'pass' : 'fail'}">
      <span class="check-icon">${c.pass ? '✓' : '✕'}</span>
      <span class="check-text">${c.text}</span>
    </div>
  `).join('');
}

function exportBuild() {
  const filled = SLOT_ORDER.filter(s => build[s]);
  if (filled.length === 0) {
    alert('Add some components first!');
    return;
  }

  let text = '# SkyForged Build Export\n\n';
  SLOT_ORDER.forEach(slot => {
    const c = build[slot];
    const mult = (slot === 'motors' || slot === 'propellers') ? 4 : 1;
    text += `**${SLOT_LABELS[slot]}:** ${c ? c.name + ` (${c.weight * mult}g, ₹${(c.price * mult).toLocaleString('en-IN')})` : '—'}\n`;
  });

  let totalWeight = 0, totalCost = 0;
  SLOT_ORDER.forEach(s => {
    if (build[s]) {
      const m = (s === 'motors' || s === 'propellers') ? 4 : 1;
      totalWeight += (build[s].weight || 0) * m;
      totalCost += (build[s].price || 0) * m;
    }
  });
  text += `\n**Total:** ${totalWeight}g · ₹${totalCost.toLocaleString('en-IN')}`;

  navigator.clipboard.writeText(text).then(() => {
    alert('Build copied to clipboard!');
  }).catch(() => {
    // Fallback
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    alert('Build copied to clipboard!');
  });
}

document.addEventListener('DOMContentLoaded', renderSlots);
