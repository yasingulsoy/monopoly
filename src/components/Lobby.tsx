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
}

export function Lobby({
  allowedNames,
  minPlayers,
  maxPlayers,
  players,
  connected,
  onJoin,
  onStart,
}: Props) {
  const [name, setName] = useState("");
  const online = players.filter((p) => p.connected).length;
  const canStart = online >= minPlayers && online <= maxPlayers;
  const roomFull = online >= maxPlayers;
  const isReconnect = (n: string) =>
    players.some((p) => p.name.toLowerCase() === n.trim().toLowerCase() && !p.connected);

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-slate-800/80 p-8 shadow-2xl backdrop-blur">
      <h1 className="text-center text-2xl font-bold">İstanbul Monopoly Deal</h1>
      <p className="mt-1 text-center text-sm text-slate-400">
        {minPlayers} veya {maxPlayers} oyuncu ile online oyna
      </p>

      <div className={`mt-4 text-center text-sm ${connected ? "text-green-400" : "text-red-400"}`}>
        {connected ? "● Sunucuya bağlı" : "○ Bağlanıyor..."}
      </div>

      <div className="mt-4 rounded-lg bg-slate-900/60 px-4 py-3 text-center">
        <span className="text-2xl font-bold text-white">{online}</span>
        <span className="text-slate-400"> / {maxPlayers} oyuncu</span>
        <p className="mt-1 text-xs text-slate-500">
          Başlamak için en az {minPlayers} kişi gerekli
        </p>
      </div>

      <div className="mt-6">
        <label className="text-sm text-slate-300">Kullanıcı adın</label>
        <div className="mt-1 flex gap-2">
          <input
            list="names"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="yasin, yunus..."
            disabled={roomFull && !isReconnect(name)}
            className="flex-1 rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white outline-none focus:border-blue-500 disabled:opacity-50"
          />
          <datalist id="names">{allowedNames.map((n) => <option key={n} value={n} />)}</datalist>
          <button
            type="button"
            onClick={() => onJoin(name)}
            disabled={!connected || !name.trim() || (roomFull && !isReconnect(name))}
            className="rounded-lg bg-blue-600 px-4 py-2 font-medium hover:bg-blue-500 disabled:opacity-40"
          >
            Katıl
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">Kayıtlı oyuncular: {allowedNames.join(", ")}</p>
      </div>

      <ul className="mt-6 space-y-2">
        {allowedNames.map((n) => {
          const p = players.find((x) => x.name.toLowerCase() === n.toLowerCase());
          return (
            <li key={n} className="flex justify-between rounded-lg bg-slate-900/60 px-4 py-2 text-sm">
              <span>{n}</span>
              <span className={p?.connected ? "text-green-400" : "text-slate-500"}>
                {p?.connected ? "● hazır" : "○ bekleniyor"}
              </span>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={onStart}
        disabled={!canStart}
        className="mt-6 w-full rounded-xl bg-emerald-600 py-3 font-bold hover:bg-emerald-500 disabled:opacity-40"
      >
        {canStart
          ? `Oyunu Başlat (${online} oyuncu)`
          : online < minPlayers
            ? `Bekleniyor… (${online}/${minPlayers} oyuncu)`
            : "Oyuncu sayısı geçersiz"}
      </button>
    </div>
  );
}
