// client/src/api/watchlists.js
import API from './index';

/** 
 * Fetches the current user’s watchlist.
 * Returns an array of objects like { ticker: 'AAPL', created_at: '…' }
 */
export function getWatchlist() {
  return API.get('/watchlist')
    .then(res => res.data);
}
