"use client";

import { useEffect } from "react";
import type { useVoice } from "@/lib/useVoice";

type Voice = ReturnType<typeof useVoice>;

interface Props {
  voice: Voice;
  myId?: string;
  players: { id: string; name: string }[];
}

export function VoicePanel({ voice, myId, players }: Props) {
  const { inVoice, connecting, muted, roster, streams, speaking, error, join, leave, toggleMute, clearError } = voice;
  const nameOf = (id: string) => players.find(p => p.id === id)?.name ?? id;

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(clearError, 5000);
    return () => clearTimeout(t);
  }, [error, clearError]);

  return (
    <div className="flex items-center gap-2">
      {/* Karşı tarafların sesi — görünmez, sadece çalar */}
      {[...streams.entries()].map(([id, stream]) => (
        <audio
          key={id}
          autoPlay
          playsInline
          ref={el => { if (el && el.srcObject !== stream) el.srcObject = stream; }}
        />
      ))}

      {inVoice && (
        <div className="hidden items-center gap-1.5 sm:flex">
          {roster.map(id => {
            const isMe = id === myId;
            const talking = speaking.has(id);
            const connected = isMe || streams.has(id);
            return (
              <span
                key={id}
                title={connected ? (talking ? "konuşuyor" : "bağlı") : "bağlanıyor..."}
                className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-all ${
                  talking
                    ? "border-emerald-400 bg-emerald-500/20 text-emerald-200"
                    : connected
                      ? "border-slate-600 bg-slate-800 text-slate-300"
                      : "border-amber-500/40 bg-amber-500/10 text-amber-300"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${
                  talking ? "bg-emerald-400" : connected ? "bg-slate-500" : "bg-amber-400 animate-pulse"
                }`} />
                {nameOf(id)}{isMe && " (sen)"}
              </span>
            );
          })}
        </div>
      )}

      {error && (
        <span className="rounded-lg bg-red-600/90 px-2.5 py-1 text-[11px] font-medium text-white">{error}</span>
      )}

      {inVoice && (
        <button
          type="button"
          onClick={toggleMute}
          title={muted ? "Mikrofonu aç" : "Mikrofonu kapat"}
          className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors ${
            muted ? "bg-red-600 text-white hover:bg-red-500" : "bg-slate-700 text-slate-200 hover:bg-slate-600"
          }`}
        >
          {muted ? "🔇 Kapalı" : "🎙️ Açık"}
        </button>
      )}

      <button
        type="button"
        onClick={inVoice ? leave : join}
        disabled={connecting}
        className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors disabled:opacity-50 ${
          inVoice ? "bg-slate-700 text-slate-200 hover:bg-slate-600" : "bg-emerald-600 text-white hover:bg-emerald-500"
        }`}
      >
        {connecting ? "Bağlanıyor..." : inVoice ? "Sesten Çık" : "🔊 Sese Katıl"}
      </button>
    </div>
  );
}
