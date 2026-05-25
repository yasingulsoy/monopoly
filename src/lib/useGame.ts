"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import type { GameState, PlayActionParams } from "./types";

const WS = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:3001";

export function useGame() {
  const socket = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [state, setState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    const s = io(WS, { transports: ["websocket", "polling"] });
    socket.current = s;
    s.on("connect", () => setConnected(true));
    s.on("disconnect", () => setConnected(false));
    s.on("game:state", (st: GameState) => { setState(st); if (st.myId) setJoined(true); });
    s.on("error", ({ message }: { message: string }) => setError(message));
    return () => { s.disconnect(); };
  }, []);

  const emit = useCallback((event: string, data?: unknown) => {
    socket.current?.emit(event, data);
  }, []);

  return {
    connected, state, error, joined,
    clearError: () => setError(null),
    join: (name: string) => emit("join", { name }),
    chat: (text: string) => emit("chat:send", { text }),
    start: () => emit("game:start"),
    bank: (cardId: string) => emit("game:bank", { cardId }),
    property: (cardId: string, color?: string) => emit("game:property", { cardId, color }),
    action: (p: PlayActionParams) => emit("game:action", p),
    pay: (cardIds: string[]) => emit("game:pay", { cardIds }),
    justSayNo: (cardId: string) => emit("game:justSayNo", { cardId }),
    acceptSteal: () => emit("game:acceptSteal"),
    endTurn: (discardIds: string[] = []) => emit("game:endTurn", { discardIds }),
  };
}
