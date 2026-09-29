'use client';

import { useState } from 'react';

export default function RouteSearch({ onAnalyze, loading }) {
  const [origin, setOrigin] = useState('Karol Bagh');
  const [destination, setDestination] = useState('Samaypur Badli');
  const [timeOfDay, setTimeOfDay] = useState('Evening (5 PM - 9 PM)');

  const handleSubmit = (e) => {
    e.preventDefault();
    onAnalyze({ origin, destination, time_of_day: timeOfDay });
  };

  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      left: '20px',
      zIndex: 1000,
      background: 'white',
      padding: '20px',
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      width: '320px',
      fontFamily: 'sans-serif'
    }}>
      <h2 style={{ margin: '0 0 12px 0', fontSize: '18px', color: '#111827', fontWeight: 'bold' }}>
        🛡️ Safe Steps Route Check
      </h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input
          type="text"
          placeholder="Origin"
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
          required
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #D1D5DB', color: '#111827' }}
        />
        <input
          type="text"
          placeholder="Destination"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          required
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #D1D5DB', color: '#111827' }}
        />
        <select
          value={timeOfDay}
          onChange={(e) => setTimeOfDay(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #D1D5DB', color: '#111827' }}
        >
          <option value="Morning (6 AM - 12 PM)">Morning (6 AM - 12 PM)</option>
          <option value="Afternoon (12 PM - 5 PM)">Afternoon (12 PM - 5 PM)</option>
          <option value="Evening (5 PM - 9 PM)">Evening (5 PM - 9 PM)</option>
          <option value="Night (9 PM - 6 AM)">Night (9 PM - 6 AM)</option>
        </select>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '10px',
            backgroundColor: loading ? '#9CA3AF' : '#2563EB',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Analyzing Route...' : 'Get Safety Score'}
        </button>
      </form>
    </div>
  );
}