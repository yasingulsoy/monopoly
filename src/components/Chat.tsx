"use client";

import { useState } from "react";
import type { ChatMessage } from "@/lib/types";

export function Chat({ messages, onSend, myName }: {
  messages: ChatMessage[];
  onSend: (t: string) => void;
  myName?: string;
}) {
  const [text, setText] = useState("");

  return (
    <div className="flex h-full flex-col rounded-xl border border-white/10 bg-slate-800/60">
      <div className="border-b border-white/10 px-4 py-2 font-semibold text-sm">Sohbet</div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              m.playerName === myName ? "ml-4 bg-blue-900/40" : "mr-4 bg-slate-700/50"
            }`}
          >
            <span className="font-semibold">{m.playerName}: </span>{m.text}
          </div>
        ))}
      </div>
      <div className="flex gap-2 border-t border-white/10 p-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && text.trim() && (onSend(text), setText(""))}
          placeholder="Mesaj..."
          className="flex-1 rounded-lg bg-slate-900 px-3 py-1.5 text-sm outline-none"
        />
        <button
          type="button"
          onClick={() => { if (text.trim()) { onSend(text); setText(""); } }}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm"
        >
          Gönder
        </button>
      </div>
    </div>
  );
}
