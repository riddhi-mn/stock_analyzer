import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Loader from './Loader';
import ErrorCard from './ErrorCard';
import API from '../api/index';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';

export default function PricePage() {
  const { ticker } = useParams();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper to safely format numbers
  const fmt = num => (typeof num === 'number' && !isNaN(num) ? num.toFixed(2) : '--');
  const plus = num => (num >= 0 ? '+' : '');

  useEffect(() => {
    API.get(`/prices/${ticker}`)
      .then(res => {
        const formatted = res.data.map(pt => ({
          ...pt,
          close: Number(pt.close),
          moving_avg_30: Number(pt.moving_avg_30),
          time: new Date(pt.timestamp).toLocaleString()
        }));
        setData(formatted);
      })
      .catch(err => setError(err.response?.data?.error || 'Failed to load data'))
      .finally(() => setLoading(false));
  }, [ticker]);

  if (loading) return <Loader message={`Loading ${ticker} prices…`} />;
  if (error) return <ErrorCard message={error} onRetry={() => window.location.reload()} />;

  // Calculate current and previous prices
  const latestIndex = data.length - 1;
  const prevIndex = data.length - 2;
  const currentPrice = latestIndex >= 0 ? data[latestIndex].close : NaN;
  const previousPrice = prevIndex >= 0 ? data[prevIndex].close : NaN;
  const priceChange = !isNaN(currentPrice) && !isNaN(previousPrice) ? currentPrice - previousPrice : NaN;
  const changePercent = !isNaN(priceChange) && previousPrice !== 0 ? (priceChange / previousPrice) * 100 : NaN;

  // Dynamic chart height
  const chartHeight = window.innerWidth < 640 ? 300 : 450;

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="flex">
        {/* Sidebar space to push content 1/3rd in */}
        <div className="w-1/3" />
        <div className="w-2/3 p-6">

          {/* Back button */}
          <Link
            to="/"
            className="inline-block mb-6 px-4 py-2 bg-violet-800 text-white font-medium rounded transition-colors duration-200 hover:bg-violet-300 hover:text-black"
          >
            ← Back to Watchlist
          </Link>

          {/* Header Card */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-4xl font-bold">{ticker}</h1>
              <div className="text-right">
                <div className="text-3xl font-bold text-cyan-400">
                  ${fmt(currentPrice)}
                </div>
                {!isNaN(priceChange) && (
                  <div className={`text-lg font-semibold ${priceChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {plus(priceChange)}${fmt(priceChange)} ({fmt(changePercent)}%)
                  </div>
                )}
              </div>
            </div>
            <div className="text-slate-300 text-lg">
              Price History & 30-Day Moving Average
            </div>
          </div>

          {/* Chart Container */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <ResponsiveContainer width="100%" height={chartHeight}>
              <LineChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
              >
                <XAxis
                  dataKey="time"
                  tick={{ angle: -45, textAnchor: 'end', fontSize: 10, fill: '#94a3b8' }}
                  height={80}
                  interval="preserveStartEnd"
                  axisLine={{ stroke: '#475569' }}
                  tickLine={{ stroke: '#475569' }}
                />
                <YAxis
                  domain={['auto', 'auto']}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  axisLine={{ stroke: '#475569' }}
                  tickLine={{ stroke: '#475569' }}
                  tickFormatter={val => `$${Number(val).toFixed(2)}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    color: '#f1f5f9'
                  }}
                  labelStyle={{ color: '#06b6d4' }}
                />
                <Line
                  type="monotone"
                  dataKey="close"
                  stroke="#06b6d4"
                  strokeWidth={3}
                  dot={false}
                  name="Price"
                />
                <Line
                  type="monotone"
                  dataKey="moving_avg_30"
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="30-Day MA"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

        </div>
      </div>
    </div>
  );
}
