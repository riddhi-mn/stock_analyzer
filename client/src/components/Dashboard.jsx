// client/src/components/Dashboard.jsx
import { useState, useEffect } from 'react';
import API from '../api/index';
import { useAuth } from '../hooks/useAuth';
import Loader from './Loader';
import ErrorCard from './ErrorCard';
import { Link } from 'react-router-dom';


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

  //if (loading) return <p className="p-4">Loading watchlist…</p>;
  if (loading) return <Loader message="Loading your watchlist…" />;
  //if (error)   return <p className="p-4 text-red-500">{error}</p>;
  if (error) return <ErrorCard message={error} onRetry={() => window.location.reload()} />;


  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-2xl mb-4">Your Watchlist</h2>
      <button onClick={logout} className="mb-4 px-3 py-1 bg-gray-200 rounded">
        Logout
      </button>
      {tickers.length === 0 ? (
        <p>No tickers yet. Add some!</p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
