/**
 * useBmsWebSocket: connects to ws://localhost:8000/ws/bms with token query.
 */
import { useEffect, useState } from "react";
import { WS_URL } from "../services/endpoints";

export function useBmsWebSocket(token) {
  const [msg, setMsg] = useState(null);
  const [status, setStatus] = useState("closed");

  useEffect(() => {
    if (!token) return;

    const url = `${WS_URL}?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(url);
    setStatus("connecting");

    ws.onopen = () => setStatus("open");
    ws.onclose = () => setStatus("closed");
    ws.onerror = () => setStatus("error");
    ws.onmessage = (e) => {
      try {
        setMsg(JSON.parse(e.data));
      } catch {
        // ignore non-JSON
      }
    };

    return () => ws.close();
  }, [token]);

  return { wsStatus: status, wsMsg: msg };
}
