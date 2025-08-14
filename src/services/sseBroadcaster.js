// src/services/sseBroadcaster.js
// Simple in-memory SSE broadcaster for single-node usage.

const knex = require('../db/knex'); // FIX: missing import
const connectionsByUser = new Map(); // userId -> { res, tickers: Set, lastId, keepAlive }

/**
 * Low-level SSE writer
 */
function sendEvent(res, eventName, data, id) {
  try {
    if (id !== undefined) res.write(`id: ${id}\n`);
    if (eventName) res.write(`event: ${eventName}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
    console.log(`[SSE SEND] event="${eventName}" id=${id} data=`, data);
  } catch (e) {
    console.error('[SSE ERROR] Failed to send event:', e.message);
  }
}

/**
 * Register a connection for a user and optionally seed initial tickers
 */
function registerConnection(userId, res, initialTickers = []) {
  const id = String(userId);
  const tickersSet = new Set((initialTickers || []).map(t => String(t).toUpperCase()));
  const entry = { res, tickers: tickersSet, lastId: 0 };

  connectionsByUser.set(id, entry);

  // send connected event + subscription snapshot
  sendEvent(res, 'connected', { userId: id, tickers: [...tickersSet] }, ++entry.lastId);

  // keepalive comment every 20s
  entry.keepAlive = setInterval(() => {
    try {
      res.write(`: keepalive ${Date.now()}\n\n`);
    } catch (e) {}
  }, 20_000);

  return entry;
}

/**
 * Unregister/close connection for user
 */
function unregisterConnection(userId) {
  const id = String(userId);
  const entry = connectionsByUser.get(id);
  if (!entry) return;
  clearInterval(entry.keepAlive);
  try { entry.res.end(); } catch (e) {}
  connectionsByUser.delete(id);
  console.log(`[SSE DISCONNECT] User ${id}`);
}

/**
 * Update a user's subscribed tickers (server-side)
 */
function updateUserTickers(userId, tickers = []) {
  const id = String(userId);
  const entry = connectionsByUser.get(id);
  if (!entry) return;
  entry.tickers = new Set(tickers.map(t => String(t).toUpperCase()));
  sendEvent(entry.res, 'subscriptionUpdate', { tickers: [...entry.tickers] }, ++entry.lastId);
}

/**
 * Send to all connected users who have this ticker in their subscription set
 */
function broadcastToTicker(ticker, payload) {
  ticker = String(ticker).toUpperCase();
  if (!ticker) return;

  if (!payload || typeof payload !== 'object') {
    console.warn('broadcastToTicker called with invalid payload:', payload);
    return;
  }

  console.log(`[SSE BROADCAST] ticker=${ticker} payload=`, payload);

  for (const [userId, entry] of connectionsByUser.entries()) {
    if (entry.tickers.has(ticker)) {
      try {
        sendEvent(entry.res, 'priceUpdate', payload, ++entry.lastId); // FIX: event name matches client listener
      } catch (e) {
        console.error(`[SSE ERROR] Failed to send to user ${userId}:`, e.message);
      }
    }
  }
}

/**
 * Send a direct message to a single connected user (if connected)
 */
function broadcastToUser(userId, payload) {
  const id = String(userId);
  const entry = connectionsByUser.get(id);
  if (!entry) return;
  sendEvent(entry.res, 'direct', payload, ++entry.lastId);
}

/**
 * Send a complete snapshot to a user (used on connect)
 */
async function sendSnapshotToUser(userId, snapshotData = null) {
  try {
    let watchlistData = snapshotData;

    // If snapshot wasn't pre-built, fetch from DB
    if (!watchlistData) {
      const watchlist = await knex('watchlists')
        .select('ticker')
        .where({ user_id: userId });

      watchlistData = {
        action: 'snapshot',
        watchlist: watchlist.map(row => row.ticker)
      };
    }

    const entry = connectionsByUser.get(String(userId));
    if (!entry) return;

    sendEvent(entry.res, 'snapshot', watchlistData, ++entry.lastId); // FIX: event name matches client listener
  } catch (err) {
    console.error('[SSE ERROR] sendSnapshotToUser failed:', err.message);
  }
}

function countConnections() {
  return connectionsByUser.size;
}

module.exports = {
  registerConnection,
  unregisterConnection,
  updateUserTickers,
  broadcastToTicker,
  broadcastToUser,
  sendSnapshotToUser,
  countConnections
};

