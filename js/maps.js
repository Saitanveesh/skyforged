/* ── DGCA Airspace Map Logic ──────────────── */

let airspaceMap;
const AIRPORTS = [
  { name: 'Indira Gandhi Int\'l (DEL)', lat: 28.5562, lon: 77.1000 },
  { name: 'Chhatrapati Shivaji (BOM)', lat: 19.0896, lon: 72.8656 },
  { name: 'Kempegowda Int\'l (BLR)', lat: 13.1986, lon: 77.7066 },
  { name: 'Rajiv Gandhi Int\'l (HYD)', lat: 17.2403, lon: 78.4294 },
  { name: 'Chennai Int\'l (MAA)', lat: 12.9941, lon: 80.1709 },
  { name: 'Netaji Subhash (CCU)', lat: 22.6547, lon: 88.4467 },
  { name: 'Hindustan (HAL) Airport', lat: 12.9515, lon: 77.6682 },
  { name: 'Pune Airport (PNQ)', lat: 18.5821, lon: 73.9197 },
  { name: 'Cochin Int\'l (COK)', lat: 10.1520, lon: 76.3920 },
  { name: 'Ahmedabad (AMD)', lat: 23.0772, lon: 72.6347 }
];

function initMap() {
  const mapEl = document.getElementById('map');
  if (!mapEl) return;

  // Initialize Map centered on India
  airspaceMap = L.map('map', {
    zoomControl: false
  }).setView([20.5937, 78.9629], 5);

  L.control.zoom({
    position: 'bottomright'
  }).addTo(airspaceMap);

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
      fillOpacity: 0.2,
      weight: 1,
      radius: 5000 
    }).addTo(airspaceMap).bindPopup(`<b>${ap.name}</b><br>RED ZONE: 5km Prohibited`);

    // Yellow Zone (12km)
    L.circle([ap.lat, ap.lon], {
      color: '#ffaa00',
      fillColor: '#ffaa00',
      fillOpacity: 0.05,
      weight: 1,
      radius: 12000
    }).addTo(airspaceMap).bindPopup(`<b>${ap.name}</b><br>YELLOW ZONE: Restricted`);
  });

  // Map Click Listener
  airspaceMap.on('click', (e) => {
    updateZoneInfo(e.latlng.lat, e.latlng.lng);
  });
}

function updateZoneInfo(lat, lon) {
  const statusBox = document.getElementById('zoneStatus');
  let zone = 'GREEN';
  let zoneClass = 'zone-green';
  let message = 'GREEN ZONE: Nano and Micro drones can fly up to 400ft (120m) without prior permission. Flight notification on Digital Sky is still required.';
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
    zone = 'RED (PROHIBITED)';
    zoneClass = 'zone-red';
    message = `<strong>NO-FLY ZONE:</strong> You are within 5km of ${nearestAP.name}. Takeoff is prohibited by DGCA Drone Rules 2021.`;
  } else if (minDist <= 12) {
    zone = 'YELLOW (RESTRICTED)';
    zoneClass = 'zone-yellow';
    message = `<strong>RESTRICTED:</strong> You are within 12km of ${nearestAP.name}. Permission from ATC and Digital Sky is mandatory before takeoff.`;
  }

  statusBox.innerHTML = `
    <div style="font-family:var(--font-mono);font-size:0.9rem;">
      <div style="margin-bottom:12px; display:flex; align-items:center;">
        <span class="zone-indicator ${zoneClass}"></span>
        <strong style="color:var(--text);">${zone}</strong>
      </div>
      <div style="margin-bottom:8px; color:var(--text-dim);">
        Lat: ${lat.toFixed(5)}<br>
        Lon: ${lon.toFixed(5)}
      </div>
      <div style="margin-bottom:16px; color:var(--text-muted); font-size:0.75rem;">
        Nearest Airport: ${nearestAP.name} (${minDist.toFixed(2)} km)
      </div>
      <p style="font-size:0.8rem; color:var(--text-dim); line-height:1.6; border-top:1px solid var(--border); padding-top:12px;">
        ${message}
      </p>
    </div>
  `;
}

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

document.addEventListener('DOMContentLoaded', initMap);
