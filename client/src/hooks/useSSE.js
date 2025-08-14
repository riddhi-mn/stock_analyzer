// client/src/hooks/useSSE.js
import { useEffect, useRef } from 'react';

export default function useSSE({ url, onSnapshot, onPriceUpdate, onStatus }) {
  const esRef = useRef(null);

  useEffect(() => {
    if (!url) return;

    // Try to get token from localStorage, sessionStorage, or cookies
    let token =
      localStorage.getItem('token') ||
      sessionStorage.getItem('token') ||
      (document.cookie.match(/(?:^|; )token=([^;]*)/)?.[1]);

    if (token) {
      // Append token if not already in URL
      const separator = url.includes('?') ? '&' : '?';
      if (!url.includes('token=')) {
        url = `${url}${separator}token=${encodeURIComponent(token)}`;
      }
      console.log("[SSE URL]", url);

    }

    const es = new EventSource(url);
    esRef.current = es;

    es.onopen = () => {
      console.log('[SSE] Connected to', url);
      onStatus?.({ connected: true });
    };

    es.onerror = (err) => {
      console.error('[SSE] Connection error:', err);
      onStatus?.({ connected: false, error: err });
      // EventSource will try to reconnect automatically
    };

    es.addEventListener('snapshot', (evt) => {
  try {
    const payload = JSON.parse(evt.data);
    console.log("[SNAPSHOT EVENT RAW]", payload);
    onSnapshot?.(payload);
  } catch (e) {
    console.error('[SSE] Snapshot parse error:', e);
  }
});

    es.addEventListener('price', (evt) => {
  try {
    console.log("[PRICE EVENT RAW]", evt.data);
    onPriceUpdate?.(JSON.parse(evt.data));
  } catch (e) {
    console.error('[SSE] Price update parse error:', e);
  }
});

es.addEventListener('ping', () => {
  console.log('[HEARTBEAT] Connection is alive');
});

    es.addEventListener('subscriptionUpdate', (evt) => {
      // optional: handle subscription changes
    });

    

    return () => {
      try {
        es.close();
      } catch (e) {}
      esRef.current = null;
    };
  }, [url, onSnapshot, onPriceUpdate, onStatus]);
}
