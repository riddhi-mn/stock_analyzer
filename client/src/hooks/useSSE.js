import { useEffect, useRef } from 'react';
import API from '../api/index.js'; // Axios instance
import { API_BASE } from '../api/index.js'; // Base URL

function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

function isTokenExpired(token) {
  const decoded = parseJwt(token);
  return !decoded || decoded.exp * 1000 < Date.now();
}

export default function useSSE(relativeUrl, token, onMessage) {
  const eventSourceRef = useRef(null);

  useEffect(() => {
    let active = true;

    async function getValidToken() {
      if (!token || isTokenExpired(token)) {
        const res = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          credentials: 'include' // send refreshToken cookie
        });

        if (!res.ok) throw new Error('Refresh failed');

        const data = await res.json();
        token = data.accessToken; // must match backend naming
        localStorage.setItem('token', token);
      }
      return token;
    }

    async function connect() {
      try {
        const validToken = await getValidToken();
        if (!active) return;

        const es = new EventSource(
          `${API_BASE}${relativeUrl}?token=${validToken}`
        );
        eventSourceRef.current = es;

        es.onmessage = (e) => {
          try {
            onMessage(JSON.parse(e.data));
          } catch (err) {
            console.error('[SSE] Failed to parse message:', err);
          }
        };

        es.onerror = async () => {
          console.warn('[SSE] Connection error — trying refresh...');
          es.close();
          try {
            await getValidToken();
            if (active) setTimeout(connect, 2000); // delay before retry
          } catch (err) {
            console.error('Token refresh failed, logging out.');
            localStorage.removeItem('token');
            window.location.href = '/login';
          }
        };
      } catch (err) {
        console.error('Initial SSE connect failed:', err);
        setTimeout(connect, 2000); // retry if initial connect fails
      }
    }

    connect();
    return () => {
      active = false;
      eventSourceRef.current?.close();
    };
  }, [relativeUrl, token, onMessage]);
}
