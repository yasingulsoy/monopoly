"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import type { GameState, PlayActionParams, PropertyColor } from "./types";

const WS = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:3001";
const NAME_KEY = "istanbul-deal:name";
const DEVICE_KEY = "istanbul-deal:device";

const savedName = () => { try { return localStorage.getItem(NAME_KEY); } catch { return null; } };

/**
 * Tarayıcıya özel sabit kimlik. Sunucu bununla "bir cihaz = bir oyuncu" kuralını
 * uyguluyor; aynı tarayıcının ikinci sekmesinden başka bir isimle girilemiyor.
 * localStorage sekmeler arasında ortak olduğu için bu iş görüyor.
 */
let memDevice: string | null = null;
function deviceId(): string {
  const make = () =>
    (globalThis.crypto?.randomUUID?.() ?? `d${Date.now()}-${Math.random().toString(36).slice(2)}`);
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) { id = make(); localStorage.setItem(DEVICE_KEY, id); }
    return id;
  } catch {
    // Gizli sekme / depolama kapalı: oturum boyunca geçerli kimlik üret
    return (memDevice ??= make());
  }
}

export function useGame() {
  const socket = useRef<Socket | null>(null);
  // Sesli sohbet aynı bağlantıyı kullanır, o yüzden soketi dışarı veriyoruz
  const [sock, setSock] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [state, setState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    const s = io(WS, { transports: ["websocket", "polling"] });
    socket.current = s;
    setSock(s);
    s.on("connect", () => {
      setConnected(true);
      // Sayfa yenileme / ağ kopması sonrası kaydedilmiş isimle otomatik geri dön
      const n = savedName();
      if (n) s.emit("join", { name: n, device: deviceId() });
    });
    s.on("disconnect", () => setConnected(false));
    s.on("game:state", (st: GameState) => { setState(st); setJoined(!!st.myId); });
    s.on("error", ({ message }: { message: string }) => setError(message));
    return () => { s.disconnect(); };
  }, []);

  const emit = useCallback((event: string, data?: unknown) => {
    socket.current?.emit(event, data);
  }, []);

  return {
    connected, state, error, joined, socket: sock,
    clearError: () => setError(null),
    join: (name: string) => {
      try { localStorage.setItem(NAME_KEY, name.trim()); } catch { /* özel pencere vb. */ }
      emit("join", { name, device: deviceId() });
    },
    leave: () => {
      try { localStorage.removeItem(NAME_KEY); } catch { /* özel pencere vb. */ }
      emit("game:leave", { device: deviceId() });
    },
    chat: (text: string) => emit("chat:send", { text }),
    start: () => emit("game:start"),
    reset: () => emit("game:reset"),
    bank: (cardId: string) => emit("game:bank", { cardId }),
    property: (cardId: string, color?: string) => emit("game:property", { cardId, color }),
    action: (p: PlayActionParams) => emit("game:action", p),
    pay: (cardIds: string[]) => emit("game:pay", { cardIds }),
    justSayNo: (cardId: string) => emit("game:justSayNo", { cardId }),
    acceptSteal: () => emit("game:acceptSteal"),
    acceptPayChallenge: () => emit("game:acceptPayChallenge"),
    moveWild: (propertyId: string, color: PropertyColor) => emit("game:moveWild", { propertyId, color }),
    endTurn: (discardIds: string[] = []) => emit("game:endTurn", { discardIds }),
  };
}
