"use client";

import { useEffect } from "react";
import { useGame } from "@/lib/useGame";
import { Lobby } from "@/components/Lobby";
import { GameBoard } from "@/components/GameBoard";

export default function Home() {
  const g = useGame();

  useEffect(() => {
    if (g.error) { const t = setTimeout(g.clearError, 4000); return () => clearTimeout(t); }
  }, [g.error, g.clearError]);

  if (!g.state) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-slate-400">Sunucuya bağlanılıyor...</p>
      </div>
    );
  }

  const inLobby = !g.joined || g.state.phase === "lobby";

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-white/10 px-6 py-4">
        <h1 className="text-lg font-bold">İstanbul Monopoly Deal</h1>
      </header>

      {g.error && (
        <div className="mx-4 mt-4 rounded-lg bg-red-600/80 px-4 py-2 text-sm">{g.error}</div>
      )}

      <main className="flex-1 p-4 lg:p-6">
        {inLobby ? (
          <Lobby
            allowedNames={g.state.allowedNames}
            minPlayers={g.state.minPlayers}
            maxPlayers={g.state.maxPlayers}
            players={g.state.players.map(p => ({ name: p.name, connected: p.connected }))}
            connected={g.connected}
            onJoin={g.join}
            onStart={g.start}
          />
        ) : (
          <div className="h-[calc(100vh-6rem)]">
            <GameBoard
              state={g.state}
              onBank={g.bank}
              onProperty={g.property}
              onAction={g.action}
              onPay={g.pay}
              onEndTurn={g.endTurn}
              onChat={g.chat}
            />
          </div>
        )}
      </main>
    </div>
  );
}
