"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/lib/types";

export function Chat({ messages, onSend, myName }: {
  messages: ChatMessage[];
  onSend: (t: string) => void;
  myName?: string;
}) {
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-700/50 bg-slate-900/80 shadow-lg">
      <div className="border-b border-slate-700/50 px-4 py-2.5 font-bold text-sm text-slate-300">Sohbet</div>
      <div className="flex-1 space-y-1.5 overflow-y-auto p-3">
        {messages.length === 0 && <p className="text-xs italic text-slate-600">Henüz mesaj yok</p>}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`rounded-xl px-3 py-2 text-xs ${
              m.playerName === myName
                ? "ml-4 bg-blue-600/20 border border-blue-500/20"
                : "mr-4 bg-slate-800 border border-slate-700/30"
            }`}
          >
            <span className="font-bold text-slate-300">{m.playerName}</span>
            <span className="text-slate-400"> · </span>
            <span className="text-slate-200">{m.text}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2 border-t border-slate-700/50 p-2.5">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && text.trim() && (onSend(text), setText(""))}
          placeholder="Mesaj yaz..."
          className="flex-1 rounded-xl bg-slate-800 border border-slate-700/50 px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50 transition-colors"
        />
        <button
          type="button"
          onClick={() => { if (text.trim()) { onSend(text); setText(""); } }}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500 transition-colors"
        >
          Gönder
        </button>
      </div>
    </div>
  );
}
