"use client";

import { useEffect } from "react";
import { useGame } from "@/lib/useGame";
import { useVoice } from "@/lib/useVoice";
import { Lobby } from "@/components/Lobby";
import { GameBoard } from "@/components/GameBoard";
import { VoicePanel } from "@/components/VoicePanel";

export default function Home() {
  const g = useGame();
  const voice = useVoice(g.socket, g.state?.myId);

  useEffect(() => {
    if (g.error) { const t = setTimeout(g.clearError, 4000); return () => clearTimeout(t); }
  }, [g.error, g.clearError]);

  if (!g.state) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 mx-auto animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <p className="text-slate-400">Sunucuya bağlanılıyor...</p>
        </div>
      </div>
    );
  }

  const st = g.state;
  const inLobby = !g.joined || st.phase === "lobby";
  const myName = st.players.find(p => p.id === st.myId)?.name;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-950 text-white">
      {/* Kısa ekranda (yatay telefon) başlık inceliyor ki masaya yer kalsın */}
      <header className="flex shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900/80 px-3 py-2 backdrop-blur sm:px-5 [@media(max-height:560px)]:py-1">
        <h1 className="truncate text-base font-black tracking-tight sm:text-lg [@media(max-height:560px)]:text-sm">
          <span className="text-red-500">Istanbul</span> Monopoly Deal
        </h1>
        <div className="flex items-center gap-3">
          {g.state.phase === "playing" && (
            <span className="hidden text-xs text-slate-400 md:inline">
              {g.state.players.filter(p => p.connected).length} oyuncu online
            </span>
          )}
          {g.joined && (
            <VoicePanel
              voice={voice}
              myId={g.state.myId}
              players={g.state.players.map(p => ({ id: p.id, name: p.name }))}
            />
          )}
        </div>
      </header>

      {!g.connected && (
        <div className="mx-4 mt-3 rounded-xl bg-amber-600/90 px-4 py-2.5 text-sm font-medium shadow-lg">
          Bağlantı koptu — yeniden bağlanılıyor...
        </div>
      )}
      {g.error && (
        <div className="mx-4 mt-3 rounded-xl bg-red-600/90 px-4 py-2.5 text-sm font-medium shadow-lg animate-in slide-in-from-top">
          {g.error}
        </div>
      )}

      <main className="min-h-0 flex-1 overflow-hidden p-2 sm:p-4 lg:p-5 [@media(max-height:560px)]:p-1.5">
        {inLobby ? (
          <Lobby
            allowedNames={g.state.allowedNames}
            minPlayers={g.state.minPlayers}
            maxPlayers={g.state.maxPlayers}
            players={g.state.players.map(p => ({ name: p.name, connected: p.connected }))}
            connected={g.connected}
            phase={g.state.phase}
            joinedAs={myName}
            onJoin={g.join}
            onStart={g.start}
            onLeave={g.leave}
          />
        ) : (
          <div className="h-full">
            <GameBoard
              state={g.state}
              onBank={g.bank}
              onProperty={g.property}
              onAction={g.action}
              onPay={g.pay}
              onEndTurn={g.endTurn}
              onChat={g.chat}
              onJustSayNo={g.justSayNo}
              onAcceptSteal={g.acceptSteal}
              onAcceptPayChallenge={g.acceptPayChallenge}
              onMoveWild={g.moveWild}
              onReset={g.reset}
              onLeave={g.leave}
            />
          </div>
        )}
      </main>
    </div>
  );
}
