import React, { useState, useCallback } from 'react';
import useSSE from '../hooks/useSSE';
import API from '../api/index';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Watchlist() {
  const [watchlist, setWatchlist] = useState([]);
  const [history, setHistory] = useState({});
  const [status, setStatus] = useState({ connected: false });

  const handleSnapshot = useCallback((data) => {
    setWatchlist(Array.isArray(data.watchlist) ? data.watchlist : []);
  }, []);

  const handlePriceUpdate = useCallback((update) => {
    const price = Number(update.price);

    setWatchlist(prev => {
      const idx = prev.findIndex(p => p.ticker === update.ticker);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], currentPrice: price, timestamp: update.timestamp };
        return copy;
      } else {
        return [...prev, { ticker: update.ticker, created_at: null, currentPrice: price }];
      }
    });

    setHistory(prev => {
      const prevHistory = prev[update.ticker] || [];
      const newEntry = { price, timestamp: update.timestamp || Date.now() };
      const updatedHistory = [...prevHistory, newEntry].slice(-50);
      return { ...prev, [update.ticker]: updatedHistory };
    });
  }, []);

  const token = localStorage.getItem('token');
  const base = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  const url = token ? `${base}/watchlists/stream?token=${token}` : null;

  useSSE({
    url,
    onSnapshot: handleSnapshot,
    onPriceUpdate: handlePriceUpdate,
    onStatus: setStatus
  });

  async function handleAdd(ticker) {
    try {
      await API.post('/watchlists', { ticker });
    } catch (err) {
      alert(err.response?.data?.error || 'Add failed');
    }
  }

  async function handleRemove(ticker) {
    try {
      await API.delete(`/watchlists/${ticker}`);
      setWatchlist(prev => prev.filter(p => p.ticker !== ticker));
      setHistory(prev => {
        const copy = { ...prev };
        delete copy[ticker];
        return copy;
      });
    } catch {
      alert('Remove failed');
    }
  }

  return (
    <div style={{
    maxWidth: '800px',      // Sets a maximum width for your content
    margin: '0 auto',         // Centers the container on the page
    display: 'flex',          // Enables flexbox for easy alignment
    flexDirection: 'column',  // Stacks the items vertically
    alignItems: 'center'      // Centers the items inside the container
  }}> 
    <h1 style={{ fontSize: 20, marginBottom: 10 }}>My Watchlist</h1>
      <div style={{ marginBottom: 8 }}>
        Connection: <strong>{status.connected ? 'connected' : 'disconnected'}</strong>
      </div>

      <div style={{ marginBottom: 12 }}>
        <input id="new-ticker" placeholder="e.g. AAPL" style={{ padding: 6, marginRight: 6 }} />
        <button onClick={() => {
          const t = document.getElementById('new-ticker').value.trim().toUpperCase();
          if (t) handleAdd(t);
        }} style={{ padding: '6px 10px' }}>Add</button>
      </div>

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {watchlist.map(item => (
          <li
            key={item.ticker}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 8,
              border: '1px solid #ddd',
              borderRadius: 6,
              marginBottom: 8,
              minWidth: 600,
            }}
          >
            {/* Ticker and Chart */}
            <Link to={`/prices/${item.ticker}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div>
                <strong>{item.ticker}</strong>
                <div style={{ fontSize: 12, color: '#666' }}>
                  {item.created_at ? new Date(item.created_at).toLocaleString() : ''}
                </div> 
              </div>

              {/* Inline mini chart */}
              {history[item.ticker] && history[item.ticker].length > 0 && (
                <div style={{ width: 150, height: 50 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={history[item.ticker]}>
                      <Line type="monotone" dataKey="price" stroke="#8884d8" dot={false} />
                      <XAxis dataKey="timestamp" hide />
                      <YAxis hide domain={['dataMin', 'dataMax']} />
                      <Tooltip
                        formatter={(value) => `$${value.toFixed(2)}`}
                        labelFormatter={(label) => new Date(label).toLocaleTimeString()}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
            </Link>

            {/* Current price and remove */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 16 }}>
                {!isNaN(item.currentPrice) && item.currentPrice != null
                  ? `$${Number(item.currentPrice).toFixed(2)}`
                  : '—'}
              </div>
              <button
                onClick={() => handleRemove(item.ticker)}
                style={{ marginTop: 6, padding: '4px 8px' }}
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
