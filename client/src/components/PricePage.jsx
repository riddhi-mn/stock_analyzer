// client/src/components/PricePage.jsx
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import API from '../api/index';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';

export default function PricePage() {
  const { ticker } = useParams();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    API.get(`/prices/${ticker}`)
      .then(res => {
        // map timestamps to displayable strings
        const formatted = res.data.map(pt => ({
          ...pt,
          time: new Date(pt.timestamp).toLocaleString()
        }));
        setData(formatted);
      })
      .catch(err => setError(err.response?.data?.error || 'Failed to load data'))
      .finally(() => setLoading(false));
  }, [ticker]);

  if (loading) return <p className="p-4">Loading prices…</p>;
  if (error)   return <p className="p-4 text-red-500">{error}</p>;

  return (
    <div className="p-4">
      <h2 className="text-2xl mb-4">{ticker} Prices</h2>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <XAxis dataKey="time" tick={{ fontSize: 10 }} minTickGap={20} />
          <YAxis domain={['auto', 'auto']} />
          <Tooltip />
          <Line type="monotone" dataKey="close" stroke="#8884d8" dot={false} />
          <Line type="monotone" dataKey="moving_avg_30" stroke="#82ca9d" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
