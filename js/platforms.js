/* ============================================
   FORGE — Platform Database
   30+ drone platforms with specs & filtering
   ============================================ */

const PLATFORMS = [
  // Indian Certified (DGCA Type Certified)
  {
    id: 'ideaforge-switch', name: 'IdeaForge SWITCH UAV', manufacturer: 'IdeaForge', category: 'dgca',
    badge: { text: 'DGCA CERTIFIED', cls: 'badge-green' },
    specs: { flight_time: '120 min', max_payload: '—', weight: '6.5 kg', max_speed: '80 km/h' },
    detail: 'Fixed-wing VTOL for long-range ISR. Dual-sensor (visible + thermal), 15km operational range. Wind resistance up to 35 km/h. High-altitude capable (up to 6000m).',
    firmware: 'IdeaForge Proprietary', protocol: 'Encrypted BlueLink', video: 'HD Encrypted'
  },
  {
    id: 'asteria-a200', name: 'Asteria A200-XT', manufacturer: 'Asteria Aerospace', category: 'dgca',
    badge: { text: 'DGCA CERTIFIED', cls: 'badge-green' },
    specs: { flight_time: '40 min', max_payload: '—', weight: '2.0 kg', max_speed: '54 km/h' },
    detail: 'DGCA Type Certified micro drone. 4K camera, swappable payloads. Targeted at mapping and surveillance. Digital Sky compliant UIN integration.',
    firmware: 'Asteria Proprietary', protocol: 'MAVLink', video: 'Digital HD'
  },
  {
    id: 'ideaforge-ninja', name: 'IdeaForge NINJA UAV', manufacturer: 'IdeaForge', category: 'dgca',
    badge: { text: 'MICRO DRONE', cls: 'badge-green' },
    specs: { flight_time: '25 min', max_payload: '—', weight: '2.0 kg', max_speed: '36 km/h' },
    detail: 'Lightweight micro drone for rapid deployment. Day/night capability. Portable, backpack-compatible design. Used by security forces.',
    firmware: 'IdeaForge Proprietary', protocol: 'Encrypted', video: 'Analog/Digital'
  },
  {
    id: 'garuda-vaman', name: 'Garuda Vaman', manufacturer: 'Garuda Aerospace', category: 'dgca',
    badge: { text: 'TYPE CERTIFIED', cls: 'badge-green' },
    specs: { flight_time: '35 min', max_payload: '0.5 kg', weight: '1.8 kg', max_speed: '50 km/h' },
    detail: 'Compact surveillance platform. Digital Sky compliant. Optimized for survey and agriculture monitoring.',
    firmware: 'ArduPilot based', protocol: 'MAVLink', video: 'Digital'
  },
  // Indian FPV / Consumer
  {
    id: 'insidefpv-elevate', name: 'InsideFPV Elevate V1', manufacturer: 'InsideFPV', category: 'cots',
    badge: { text: 'INDIAN FPV', cls: 'badge-cyan' },
    specs: { flight_time: '15 min', max_payload: '—', weight: '0.8 kg', max_speed: '140 km/h' },
    detail: 'Consumer FPV platform designed and assembled in India. Plug-and-play FPV for hobbyists and filmmakers. ELRS native.',
    firmware: 'Betaflight', protocol: 'ELRS 3.x', video: 'Analog / Avatar HD'
  },
  // Custom Build
  {
    id: 'custom-dgca-nano', name: 'Custom DGCA Nano Build', manufacturer: 'Various', category: 'custom-build',
    badge: { text: 'NANO (<=250g)', cls: 'badge-cyan' },
    specs: { flight_time: 'Varies', max_payload: '—', weight: '< 250 g', max_speed: 'Varies' },
    detail: 'Sub-250g custom builds using the Model Builder. Eligible for expanded flight zones in India without UIN (though Digital Sky registration is still required).',
    firmware: 'Betaflight / iNav', protocol: 'ELRS / Crossfire', video: 'Analog / DJI O3'
  },
  // Tactical / Defense (Indian)
  {
    id: 'ideaforge-forge', name: 'IdeaForge FORGE (Tactical)', manufacturer: 'IdeaForge', category: 'tactical',
    badge: { text: 'DEFENSE', cls: 'badge-red' },
    specs: { flight_time: '45 min', max_payload: '1.0 kg', weight: '4.5 kg', max_speed: '60 km/h' },
    detail: 'Tactical build for military ops. High ECM resistance, point-to-point encryption. Used for boundary surveillance and tactical ISR.',
    firmware: 'Proprietary', protocol: 'SecureLink', video: 'Thermal / EO'
  },
  {
    id: 'asteria-a400', name: 'Asteria A400', manufacturer: 'Asteria Aerospace', category: 'tactical',
    badge: { text: 'DEFENSE', cls: 'badge-red' },
    specs: { flight_time: '45 min', max_payload: '1.5 kg', weight: '4.5 kg', max_speed: '54 km/h' },
    detail: 'Vertical takeoff fixed-wing capable. Advanced surveillance and reconnaissance platform for defense forces.',
    firmware: 'Asteria Proprietary', protocol: 'MAVLink (Secure)', video: 'Digital HD'
  }
];

let currentFilter = 'all';

function setFilter(filter) {
  currentFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });
  renderPlatforms();
}

function filterPlatforms() {
  renderPlatforms();
}

function renderPlatforms() {
  const search = (document.getElementById('platformSearch')?.value || '').toLowerCase();
  const container = document.getElementById('platformList');

  const filtered = PLATFORMS.filter(p => {
    const matchFilter = currentFilter === 'all' || p.category === currentFilter;
    const matchSearch = !search || p.name.toLowerCase().includes(search) || p.manufacturer.toLowerCase().includes(search) || p.detail.toLowerCase().includes(search);
    return matchFilter && matchSearch;
  });

  container.innerHTML = filtered.map(p => `
    <div class="platform-card" id="${p.id}" onclick="this.classList.toggle('expanded')">
      <div class="platform-card-header">
        <div>
          <div class="platform-name">${p.name}</div>
          <div style="font-family:var(--font-mono);font-size:0.72rem;color:var(--text-muted);margin-top:2px;">${p.manufacturer}</div>
        </div>
        <span class="platform-badge ${p.badge.cls}">${p.badge.text}</span>
      </div>
      <div class="platform-specs">
        <div class="spec-item"><span class="spec-label">Flight Time</span><span class="spec-value">${p.specs.flight_time}</span></div>
        <div class="spec-item"><span class="spec-label">Max Payload</span><span class="spec-value">${p.specs.max_payload}</span></div>
        <div class="spec-item"><span class="spec-label">Weight</span><span class="spec-value">${p.specs.weight}</span></div>
        <div class="spec-item"><span class="spec-label">Max Speed</span><span class="spec-value">${p.specs.max_speed}</span></div>
      </div>
      <div class="platform-detail">
        <p style="color:var(--text-dim);line-height:1.7;margin-bottom:12px;">${p.detail}</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;">
          <div class="spec-item"><span class="spec-label">Firmware</span><span class="spec-value" style="font-size:0.78rem;">${p.firmware}</span></div>
          <div class="spec-item"><span class="spec-label">Protocol</span><span class="spec-value" style="font-size:0.78rem;">${p.protocol}</span></div>
          <div class="spec-item"><span class="spec-label">Video Link</span><span class="spec-value" style="font-size:0.78rem;">${p.video}</span></div>
        </div>
      </div>
    </div>
  `).join('');

  // Update stats
  document.getElementById('statTotal').textContent = PLATFORMS.length;
  document.getElementById('statBlue').textContent = PLATFORMS.filter(p => p.category === 'blue-uas').length;
  document.getElementById('statCots').textContent = PLATFORMS.filter(p => p.category === 'cots').length;
  document.getElementById('statTactical').textContent = PLATFORMS.filter(p => p.category === 'tactical').length;
}

document.addEventListener('DOMContentLoaded', renderPlatforms);
