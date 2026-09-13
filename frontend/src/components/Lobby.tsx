"use client";

import { useState } from "react";

interface Props {
  allowedNames: string[];
  minPlayers: number;
  maxPlayers: number;
  players: { name: string; connected: boolean }[];
  connected: boolean;
  onJoin: (name: string) => void;
  onStart: () => void;
  phase?: "lobby" | "playing" | "finished";
  /** Bu cihazdan katılmış oyuncunun adı — katıldıysan isim formu kapanır */
  joinedAs?: string;
}

export function Lobby({
  allowedNames,
  minPlayers,
  maxPlayers,
  players,
  connected,
  onJoin,
  onStart,
  phase = "lobby",
  joinedAs,
}: Props) {
  const [name, setName] = useState("");
  const online = players.filter((p) => p.connected).length;
  const canStart = online >= minPlayers && online <= maxPlayers;
  const roomFull = online >= maxPlayers;
  const isReconnect = (n: string) =>
    players.some((p) => p.name.toLowerCase() === n.trim().toLowerCase() && !p.connected);

  return (
    <div className="mx-auto max-w-lg">
      <div className="rounded-3xl border border-slate-700/50 bg-gradient-to-b from-slate-800/90 to-slate-900/90 p-8 shadow-2xl backdrop-blur">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-black">
            <span className="text-red-500">Istanbul</span> Monopoly Deal
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Kart oyununu arkadaşlarınla online oyna
          </p>
        </div>

        <div className={`text-center text-sm font-medium mb-6 ${connected ? "text-green-400" : "text-red-400"}`}>
          <span className="inline-block h-2 w-2 rounded-full mr-1.5 animate-pulse" style={{ background: connected ? "#4ade80" : "#f87171" }} />
          {connected ? "Sunucuya bağlı" : "Bağlanıyor..."}
        </div>

        {phase !== "lobby" && (
          <div className="mb-6 rounded-2xl border border-amber-500/40 bg-amber-950/40 p-4 text-center text-sm text-amber-200">
            Oyun devam ediyor. Oyundaysan <strong>kendi adını</strong> yazıp geri dönebilirsin; yeni oyuncu alınmıyor.
          </div>
        )}

        {/* Oyuncu sayacı */}
        <div className="rounded-2xl bg-slate-800/80 border border-slate-700/50 p-5 text-center mb-6">
          <div className="text-4xl font-black text-white">{online}<span className="text-slate-500 text-2xl">/{maxPlayers}</span></div>
          <p className="mt-1 text-xs text-slate-400">
            Başlamak için en az {minPlayers} oyuncu gerekli
          </p>
        </div>

        {/* İsim girişi — katıldıysan kapanır (bir cihaz = bir oyuncu) */}
        {joinedAs ? (
          <div className="mb-6 rounded-2xl border border-emerald-500/40 bg-emerald-950/40 p-4 text-center">
            <p className="text-sm text-emerald-200">
              <span className="font-bold">{joinedAs}</span> olarak katıldın
            </p>
            <p className="mt-1 text-xs text-emerald-300/70">
              Bu cihazdan tek oyuncu oynayabilir. Diğerleri kendi telefon/bilgisayarından girsin.
            </p>
          </div>
        ) : (
          <div className="mb-6">
            <label className="text-sm font-medium text-slate-300 mb-2 block">Adını seç ve katıl</label>
            <div className="flex gap-2">
              <input
                list="names"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="İsim seç..."
                disabled={roomFull && !isReconnect(name)}
                className="flex-1 rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500 disabled:opacity-50 transition-colors"
              />
              <datalist id="names">{allowedNames.map((n) => <option key={n} value={n} />)}</datalist>
              <button
                type="button"
                onClick={() => onJoin(name)}
                disabled={!connected || !name.trim() || (roomFull && !isReconnect(name))}
                className="rounded-xl bg-blue-600 px-6 py-3 font-bold hover:bg-blue-500 disabled:opacity-40 transition-colors"
              >
                Katıl
              </button>
            </div>
          </div>
        )}

        {/* Oyuncu listesi */}
        <div className="space-y-2 mb-6">
          {allowedNames.map((n) => {
            const p = players.find((x) => x.name.toLowerCase() === n.toLowerCase());
            return (
              <div key={n} className={`flex items-center justify-between rounded-xl px-4 py-3 transition-all ${
                p?.connected ? "bg-green-500/10 border border-green-500/30" : "bg-slate-800/60 border border-slate-700/30"
              }`}>
                <span className={`font-medium ${p?.connected ? "text-green-300" : "text-slate-400"}`}>{n}</span>
                <span className={`flex items-center gap-1.5 text-xs ${p?.connected ? "text-green-400" : "text-slate-500"}`}>
                  <span className={`h-2 w-2 rounded-full ${p?.connected ? "bg-green-400 animate-pulse" : "bg-slate-600"}`} />
                  {p?.connected ? "Hazır" : "Bekleniyor"}
                </span>
              </div>
            );
          })}
        </div>

        {/* Başlat */}
        {phase === "lobby" && (
          <button
            type="button"
            onClick={onStart}
            disabled={!canStart}
            className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 py-4 text-lg font-black shadow-lg shadow-emerald-500/20 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-40 disabled:shadow-none transition-all"
          >
            {canStart
              ? `Oyunu Başlat (${online} oyuncu)`
              : online < minPlayers
                ? `${minPlayers - online} oyuncu daha bekleniyor...`
                : "Oyuncu sayısı geçersiz"}
          </button>
        )}
      </div>
    </div>
  );
}
