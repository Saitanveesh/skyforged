/* ============================================
   FORGE — Shared JavaScript
   Navigation, search, scroll, animations
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initSearch();
  initScrollAnimations();
  initProgressBar();
  initStats();
});

/* ── Navigation ─────────────────────────── */
function initNav() {
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');
  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    links.classList.toggle('open');
    toggle.textContent = links.classList.contains('open') ? '✕' : '☰';
  });

  // Close mobile menu on link click
  links.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.textContent = '☰';
    });
  });

  // Active link highlighting
  const current = window.location.pathname.split('/').pop() || 'index.html';
  links.querySelectorAll('a').forEach(a => {
    const href = a.getAttribute('href');
    a.classList.toggle('active', href === current);
  });
}

/* ── Search ─────────────────────────────── */
const searchIndex = [
  { title: 'Academy', url: 'academy.html', desc: 'Beginner roadmap, glossary, and first flight checklist' },
  { title: 'Pilot Roadmap', url: 'academy.html#roadmap', desc: 'Step-by-step path for beginner drone pilots' },
  { title: 'Drone Glossary', url: 'academy.html#glossary', desc: 'Common drone terms and acronyms explained' },
  { title: 'FPV Channel Planner', url: 'tools.html#channel-planner', desc: 'Plan 5.8 GHz FPV channels for up to 6 pilots' },
  { title: 'Harmonics Calculator', url: 'tools.html#harmonics', desc: 'Check TX harmonics against FPV/GPS frequencies' },
  { title: 'Range Estimator', url: 'tools.html#range-estimator', desc: 'Friis equation link budget calculator' },
  { title: 'Fresnel Zone Calculator', url: 'tools.html#fresnel', desc: 'First Fresnel zone radius at any distance' },
  { title: 'Dipole Antenna Calculator', url: 'tools.html#dipole', desc: 'Quarter/half-wave antenna element lengths' },
  { title: 'Frequency Lookup', url: 'tools.html#freq-lookup', desc: 'Find nearest named FPV channel' },
  { title: 'VTX Table Generator', url: 'tools.html#vtx-table', desc: 'Generate Betaflight vtxtable CLI commands' },
  { title: 'FC Target Matcher', url: 'tools.html#fc-matcher', desc: 'Identify FC target from status output' },
  { title: 'Ops Center', url: 'ops.html', desc: 'Tactical tools, pre-flight safety, flight time estimator' },
  { title: 'Flight Time Estimator', url: 'ops.html#flight-time', desc: 'Calculate hover time and payload capacity' },
  { title: 'Go / No-Go Matrix', url: 'ops.html#go-nogo', desc: 'Pre-flight safety checklist with Kp index and wind limit' },
  { title: 'The Five Link Types', url: 'handbook.html#ch1', desc: 'RC, telemetry, video, payload, mesh' },
  { title: 'Frequency Bands', url: 'handbook.html#ch2', desc: '900 MHz, 2.4 GHz, 5.8 GHz, sub-GHz' },
  { title: 'Antennas', url: 'handbook.html#ch3', desc: 'Omni vs directional, polarization, gain' },
  { title: 'Link Budgets', url: 'handbook.html#ch4', desc: 'Range estimation without the math' },
  { title: 'The Four Firmwares', url: 'handbook.html#ch5', desc: 'Betaflight, iNav, ArduPilot, PX4' },
  { title: 'MSP Protocol', url: 'handbook.html#ch6', desc: 'Betaflight/iNav serial protocol' },
  { title: 'MAVLink Protocol', url: 'handbook.html#ch7', desc: 'ArduPilot/PX4 communication' },
  { title: 'UART Layout', url: 'handbook.html#ch8', desc: 'Serial port allocation on FCs' },
  { title: 'Pre-Flight Checklist', url: 'handbook.html#ch9', desc: 'The checklist that catches real problems' },
  { title: 'Blackbox Logs', url: 'handbook.html#ch10', desc: 'What the traces mean' },
  { title: 'PID Tuning', url: 'handbook.html#ch11', desc: 'Tuning for people who fly' },
  { title: 'Troubleshooting', url: 'handbook.html#ch12', desc: 'The diagnostic tree' },
  { title: 'Companion Computers', url: 'handbook.html#ch13', desc: 'VOXL 2, Jetson, Pi integration' },
  { title: 'Mesh Radios', url: 'handbook.html#ch14', desc: 'Doodle Labs, Silvus, Persistent Systems' },
  { title: 'TAK Integration', url: 'handbook.html#ch15', desc: 'Cursor-on-Target, ATAK, WinTAK' },
  { title: 'Platforms Database', url: 'platforms.html', desc: 'Browse 30+ drone platforms with specs and DGCA compliance status' },
  { title: 'Model Builder', url: 'builder.html', desc: 'Assemble builds with compatibility checking' },
  { title: 'IdeaForge SWITCH UAV', url: 'platforms.html#ideaforge-switch', desc: 'Long-range VTOL, 120 min endurance' },
  { title: 'Asteria A200-XT', url: 'platforms.html#asteria-a200', desc: 'DGCA Type Certified micro drone' },
  { title: 'Garuda Vaman', url: 'platforms.html#garuda-vaman', desc: 'Type Certified survey platform' },
  { title: 'ELRS Reference', url: 'tools.html#elrs-ref', desc: 'ExpressLRS hardware reference' },
  { title: 'SWR Converter', url: 'tools.html#swr-converter', desc: 'VSWR, Return Loss, and Reflection Coefficient' },
  { title: 'Antenna Downtilt', url: 'tools.html#downtilt-calc', desc: 'Optimal GCS antenna mechanical tilt' },
  { title: 'EIRP Budget', url: 'tools.html#eirp-calc', desc: 'Effective Isotropic Radiated Power budget' },
  { title: 'Polarization Loss', url: 'tools.html#polar-loss', desc: 'Signal loss due to antenna misalignment' },
];

function initSearch() {
  const overlay = document.getElementById('searchOverlay');
  const input = document.getElementById('searchInput');
  const results = document.getElementById('searchResults');
  if (!overlay || !input) return;

  // Keyboard shortcut
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      toggleSearch();
    }
    if (e.key === 'Escape' && overlay.classList.contains('active')) {
      toggleSearch();
    }
  });

  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) toggleSearch();
  });

  // Search input
  input.addEventListener('input', () => {
    const q = input.value.toLowerCase().trim();
    if (!q) {
      results.innerHTML = '<div style="padding:16px;color:var(--text-muted);font-family:var(--font-mono);font-size:0.8rem;">Type to search...</div>';
      return;
    }
    const matches = searchIndex.filter(item =>
      item.title.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q)
    );
    if (matches.length === 0) {
      results.innerHTML = '<div style="padding:16px;color:var(--text-muted);font-family:var(--font-mono);font-size:0.8rem;">No results found</div>';
      return;
    }
    results.innerHTML = matches.map(item => `
      <a href="${item.url}" class="search-result-item">
        <div class="search-result-title">${highlightMatch(item.title, q)}</div>
        <div class="search-result-preview">${item.desc}</div>
      </a>
    `).join('');
  });

  function toggleSearch() {
    overlay.classList.toggle('active');
    if (overlay.classList.contains('active')) {
      input.value = '';
      input.focus();
      results.innerHTML = '<div style="padding:16px;color:var(--text-muted);font-family:var(--font-mono);font-size:0.8rem;">Type to search...</div>';
    }
  }

  function highlightMatch(text, query) {
    const idx = text.toLowerCase().indexOf(query);
    if (idx === -1) return text;
    return text.slice(0, idx) + '<span style="color:var(--accent)">' + text.slice(idx, idx + query.length) + '</span>' + text.slice(idx + query.length);
  }

  // Make toggleSearch global
  window.toggleSearch = toggleSearch;
}

/* ── Scroll Animations ──────────────────── */
function initScrollAnimations() {
  const elements = document.querySelectorAll('.animate-in, .card');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.05, rootMargin: '0px 0px -20px 0px' });

  elements.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    const delay = Math.min(i * 0.05, 0.3);
    el.style.transition = `opacity 0.5s ease ${delay}s, transform 0.5s ease ${delay}s`;
    observer.observe(el);
  });
}

/* ── Reading Progress Bar ───────────────── */
function initProgressBar() {
  const bar = document.querySelector('.progress-bar');
  if (!bar) return;

  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width = progress + '%';
  });
}

/* ── Utility: Format numbers ────────────── */
function formatNumber(n, decimals = 2) {
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + 'k';
  return n.toFixed(decimals);
}

/* ── Utility: dBm to mW and back ────────── */
function dBm_to_mW(dBm) { return Math.pow(10, dBm / 10); }
function mW_to_dBm(mW) { return 10 * Math.log10(mW); }

/* ── Utility: Frequency formatting ──────── */
function formatFreq(mhz) {
  if (mhz >= 1000) return (mhz / 1000).toFixed(3) + ' GHz';
  return mhz.toFixed(1) + ' MHz';
}

/* ── Home Stats ────────────────────────── */
function initStats() {
  const statParts = document.getElementById('statParts');
  if (!statParts || typeof COMPONENTS === 'undefined') return;

  const total = Object.values(COMPONENTS).reduce((sum, cat) => sum + cat.length, 0);
  statParts.textContent = total.toLocaleString() + '+';
}
