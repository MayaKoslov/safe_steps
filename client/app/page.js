'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

const Map = dynamic(() => import('./components/map'), { ssr: false });

export default function Home() {
  const [origin, setOrigin] = useState('Bawana');
  const [destination, setDestination] = useState('Kanjhawala');
  const [timeOfDay, setTimeOfDay] = useState('Night (9 PM - 6 AM)');
  const [isLoading, setIsLoading] = useState(false);

  // Quick live-demo community reviews state
  const [reviews, setReviews] = useState([
    { id: 1, spot: 'Bawana', rating: 2, text: 'Poor street lighting near the main junction after 8 PM.', author: 'Priya S.' },
    { id: 2, spot: 'Connaught Place', rating: 5, text: 'Active police patrolling and well-lit walkways.', author: 'Ananya M.' }
  ]);
  const [newComment, setNewComment] = useState('');

  const [safetyData, setSafetyData] = useState({
    safety_score: 75,
    zone_color: 'yellow',
    safety_summary: 'Enter locations to analyze safety risks along your commuting route.',
    key_warnings: ['Check local transport availability.'],
    originCoords: [28.7997, 77.0329],
    destCoords: [28.8000, 77.0500],
    routePath: [],
    durationMinutes: null,
    distanceKm: null
  });

  const handleAnalyze = async (e) => {
    if (e) e.preventDefault();
    setIsLoading(true);

    try {
      // 1. Geocode both Origin and Destination via OpenStreetMap
      const [originRes, destRes] = await Promise.all([
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(origin + ', Delhi, India')}`),
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destination + ', Delhi, India')}`)
      ]);

      const originData = await originRes.json();
      const destData = await destRes.json();

      let originLatLon = [28.7997, 77.0329];
      let destLatLon = [28.8000, 77.0500];

      if (originData && originData.length > 0) {
        originLatLon = [parseFloat(originData[0].lat), parseFloat(originData[0].lon)];
      }
      if (destData && destData.length > 0) {
        destLatLon = [parseFloat(destData[0].lat), parseFloat(destData[0].lon)];
      }

      // 2. Fetch Route Path, Duration, and Distance from OSRM
      let routePolyline = [originLatLon, destLatLon];
      let durationMins = null;
      let distKm = null;

      try {
        const osrmRes = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${originLatLon[1]},${originLatLon[0]};${destLatLon[1]},${destLatLon[0]}?overview=full&geometries=geojson`
        );
        const osrmData = await osrmRes.json();

        if (osrmData.routes && osrmData.routes.length > 0) {
          const route = osrmData.routes[0];
          // Convert GeoJSON [lon, lat] coordinates to Leaflet [lat, lon]
          routePolyline = route.geometry.coordinates.map((coord) => [coord[1], coord[0]]);
          // Convert duration (seconds -> minutes) and distance (meters -> kilometers)
          durationMins = Math.round(route.duration / 60);
          distKm = (route.distance / 1000).toFixed(1);
        }
      } catch (osrmErr) {
        console.warn("OSRM path generation fallback active:", osrmErr);
      }

      // 3. Fetch dynamic safety analysis from Flask backend
      const res = await fetch('http://127.0.0.1:5000/api/analyze-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: origin,
          destination: destination,
          time_of_day: timeOfDay,
        }),
      });

      if (!res.ok) throw new Error('Flask backend unreachable');

      const data = await res.json();

      // 4. Update UI State with pins, path, commute time, and safety score
      setSafetyData({
        safety_score: data.safety_score,
        zone_color: data.zone_color,
        safety_summary: data.safety_summary,
        key_warnings: data.key_warnings || [],
        originCoords: originLatLon,
        destCoords: destLatLon,
        routePath: routePolyline,
        durationMinutes: durationMins,
        distanceKm: distKm
      });

    } catch (err) {
      console.error("Analysis Error:", err);
      alert("Error: Ensure Flask server is running on http://127.0.0.1:5000");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddReview = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const newRev = {
      id: Date.now(),
      spot: origin,
      rating: 4,
      text: newComment,
      author: 'Live Demo User'
    };
    setReviews([newRev, ...reviews]);
    setNewComment('');
  };

  return (
    <main style={{ display: 'flex', height: '100vh', width: '100vw', fontFamily: 'sans-serif' }}>
      {/* Sidebar Controls */}
      <div style={{ width: '380px', padding: '20px', background: '#fff', zIndex: 10, boxShadow: '2px 0 10px rgba(0,0,0,0.1)', overflowY: 'auto' }}>
        <h2>🔵 Safe Steps Route Check</h2>
        <form onSubmit={handleAnalyze} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Origin</label>
            <input 
              type="text" 
              value={origin} 
              onChange={(e) => setOrigin(e.target.value)}
              style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ccc' }} 
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Destination</label>
            <input 
              type="text" 
              value={destination} 
              onChange={(e) => setDestination(e.target.value)}
              style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ccc' }} 
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Time of Day</label>
            <select 
              value={timeOfDay} 
              onChange={(e) => setTimeOfDay(e.target.value)}
              style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option>Daytime (6 AM - 5 PM)</option>
              <option>Evening (5 PM - 9 PM)</option>
              <option>Night (9 PM - 6 AM)</option>
            </select>
          </div>
          <button 
            type="submit" 
            disabled={isLoading}
            style={{ padding: '10px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {isLoading ? 'Analyzing Path...' : 'Get Safety Score'}
          </button>
        </form>

        <hr style={{ margin: '20px 0' }} />

        {/* Safety & Commute Details Output */}
        <div>
          {/* Commute Time & Distance Badge */}
          {safetyData.durationMinutes && (
            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '10px', borderRadius: '6px', marginBottom: '16px', display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#1E40AF', textTransform: 'uppercase', fontWeight: 'bold' }}>Est. Travel Time</span>
                <p style={{ margin: '2px 0 0 0', fontSize: '18px', fontWeight: 'bold', color: '#1E3A8A' }}>⏱️ {safetyData.durationMinutes} mins</p>
              </div>
              <div style={{ borderLeft: '1px solid #BFDBFE', paddingLeft: '12px' }}>
                <span style={{ fontSize: '11px', color: '#1E40AF', textTransform: 'uppercase', fontWeight: 'bold' }}>Distance</span>
                <p style={{ margin: '2px 0 0 0', fontSize: '18px', fontWeight: 'bold', color: '#1E3A8A' }}>🚗 {safetyData.distanceKm} km</p>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Safety Score:</h3>
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: safetyData.zone_color === 'red' ? '#EF4444' : safetyData.zone_color === 'yellow' ? '#F59E0B' : '#10B981' }}>
              {safetyData.safety_score}/100
            </span>
          </div>
          <p style={{ fontSize: '14px', color: '#4B5563' }}>{safetyData.safety_summary}</p>
          <ul>
            {safetyData.key_warnings.map((w, idx) => (
              <li key={idx} style={{ fontSize: '13px', color: '#DC2626' }}>{w}</li>
            ))}
          </ul>
        </div>

        {/* Community Spot Reviews */}
        <div style={{ marginTop: '20px', borderTop: '1px solid #E5E7EB', paddingTop: '12px' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 'bold', margin: '0 0 8px 0' }}>💬 Community Tips ({origin})</h4>
          
          <div style={{ maxHeight: '110px', overflowY: 'auto', marginBottom: '8px' }}>
            {reviews.filter(r => r.spot.toLowerCase().includes(origin.toLowerCase())).length === 0 ? (
              <p style={{ fontSize: '11px', color: '#6B7280' }}>No recent tips for this spot.</p>
            ) : (
              reviews.filter(r => r.spot.toLowerCase().includes(origin.toLowerCase())).map((r) => (
                <div key={r.id} style={{ background: '#F3F4F6', padding: '6px 8px', borderRadius: '4px', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold' }}>
                    <span>{r.author}</span>
                    <span>{'⭐'.repeat(r.rating)}</span>
                  </div>
                  <p style={{ fontSize: '11px', margin: '2px 0 0 0', color: '#374151' }}>{r.text}</p>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleAddReview} style={{ display: 'flex', gap: '4px' }}>
            <input 
              type="text" 
              placeholder={`Add tip for ${origin}...`}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              style={{ flex: 1, padding: '6px', fontSize: '11px', borderRadius: '4px', border: '1px solid #CCC' }}
            />
            <button 
              type="submit" 
              style={{ padding: '6px 10px', background: '#10B981', color: '#FFF', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Post
            </button>
          </form>
        </div>
      </div>

      {/* Dynamic Leaflet Map */}
      <div style={{ flex: 1, height: '100%' }}>
        <Map 
          safetyScore={safetyData.safety_score} 
          zoneColor={safetyData.zone_color} 
          originCoords={safetyData.originCoords}
          destCoords={safetyData.destCoords}
          routePath={safetyData.routePath}
        />
      </div>
    </main>
  );
}
