'use client';

import { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Helper function to create custom SVG map pins with dynamic safety colors
const createColorIcon = (colorHex) => {
  const svg = `
    <svg width="30" height="42" viewBox="0 0 24 36" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 24 12 24s12-15 12-24c0-6.63-5.37-12-12-12z" fill="${colorHex}" stroke="#FFFFFF" stroke-width="2"/>
      <circle cx="12" cy="12" r="5" fill="#FFFFFF"/>
    </svg>
  `;
  return L.divIcon({
    className: 'custom-pin-icon',
    html: svg,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -36],
  });
};

export default function Map({ 
  safetyScore = 85, 
  zoneColor = 'green', 
  originCoords = [28.7997, 77.0329],
  destCoords = [28.8000, 77.0500],
  routePath = [] 
}) {
  useEffect(() => {
    if (!originCoords) return;

    // Determine color codes based on zoneColor
    let colorHex = '#10B981'; // Green
    let labelText = 'Safe Zone';

    if (zoneColor === 'red' || safetyScore < 50) {
      colorHex = '#EF4444'; // Red
      labelText = 'High Risk Area';
    } else if (zoneColor === 'yellow' || (safetyScore >= 50 && safetyScore < 75)) {
      colorHex = '#F59E0B'; // Yellow
      labelText = 'Caution Area';
    }

    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;

    // Reset Leaflet instance if already initialized on this DOM node
    if (mapContainer._leaflet_id) {
      mapContainer._leaflet_id = null;
      mapContainer.innerHTML = '';
    }

    // Initialize map
    const map = L.map('map').setView(originCoords, 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    // 1. Add highlighted status area circle overlay at origin
    L.circle(originCoords, {
      color: colorHex,
      fillColor: colorHex,
      fillOpacity: 0.2,
      radius: 1000,
    }).addTo(map);

    // 2. Add Origin Marker
    L.marker(originCoords, { icon: createColorIcon(colorHex) })
      .addTo(map)
      .bindPopup(`
        <div style="font-family: sans-serif; text-align: center;">
          <strong style="color: ${colorHex}; font-size: 14px;">${labelText} (Origin)</strong><br/>
          <span>Safety Score: <b>${safetyScore}/100</b></span>
        </div>
      `);

    // 3. Add Destination Marker (if available)
    if (destCoords) {
      L.marker(destCoords, { icon: createColorIcon('#2563EB') })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: sans-serif; text-align: center;">
            <strong style="color: #2563EB; font-size: 14px;">Destination Point</strong>
          </div>
        `);
    }

    // 4. Draw Route Polyline and Auto-Fit Camera Bounds
    if (routePath && routePath.length > 0) {
      const polyline = L.polyline(routePath, {
        color: colorHex,
        weight: 6,
        opacity: 0.85,
        dashArray: zoneColor === 'red' ? '10, 10' : null
      }).addTo(map);

      // Smoothly fit camera view to encompass full route
      map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
    }

    return () => {
      map.remove();
    };
  }, [originCoords, destCoords, routePath, safetyScore, zoneColor]);

  return <div id="map" style={{ width: '100%', height: '100vh' }} />;
}
