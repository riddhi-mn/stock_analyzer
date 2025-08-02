// client/src/components/Dashboard.jsx
import { useState, useEffect } from 'react';
import API from '../api/index';
import { useAuth } from '../hooks/useAuth';

export default function Dashboard() {
  const { logout } = useAuth();
  const [tickers, setTickers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    API.get('/watchlists')
      .then(res => setTickers(res.data))
      .catch(err => setError(err.response?.data?.error || 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="p-4">Loading watchlist…</p>;
  if (error)   return <p className="p-4 text-red-500">{error}</p>;

  return (
    <div className="p-4">
      <h2 className="text-2xl mb-4">Your Watchlist</h2>
      <button onClick={logout} className="mb-4 px-3 py-1 bg-gray-200 rounded">
        Logout
      </button>
      {tickers.length === 0 ? (
        <p>No tickers yet. Add some!</p>
      ) : (
        <ul className="space-y-2">
          {tickers.map(item => (
            <li key={item.ticker}>
              <a
                href={`/prices/${item.ticker}`}
                className="text-blue-600 hover:underline"
              >
                {item.ticker}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
