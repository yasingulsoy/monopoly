import express from "express";
import { createServer } from "http";
import { Server, type Socket } from "socket.io";
import cors from "cors";
import { ALLOWED_ORIGINS, HOST, isAllowedOrigin, PORT, loadAllowedNames, MIN_PLAYERS, MAX_PLAYERS } from "./config.js";
import { Game } from "./game/engine.js";
import type { PlayActionParams } from "./game/types.js";

const corsOrigin = (origin: string | undefined, cb: (err: Error | null, ok?: boolean) => void) =>
  cb(null, isAllowedOrigin(origin));

const app = express();
app.use(cors({ origin: corsOrigin }));
app.get("/health", (_, res) => res.json({ ok: true }));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: corsOrigin },
  // Mobil/kararsız bağlantılarda kısa kopmalar "ayrıldı" sayılmasın
  pingInterval: 10000,
  pingTimeout: 25000,
});
const game = new Game(loadAllowedNames(), MIN_PLAYERS, MAX_PLAYERS);

/** Her oyuncunun (sabit kimlik) şu an hangi sokette olduğu — eski soketin geç gelen kopuşunu yok saymak için */
const activeSocket = new Map<string, string>();

/**
 * Sesli sohbete katılmış oyuncular. Ses buradan GEÇMEZ — bu sadece
 * tarayıcıların birbirini bulması için mesaj taşır (WebRTC sinyalleşmesi).
 */
const voice = new Set<string>();
const socketOf = (pid: string) => {
  const sid = activeSocket.get(pid);
  return sid ? io.sockets.sockets.get(sid) : undefined;
};
const broadcastVoice = () => io.emit("voice:roster", [...voice]);

function broadcast() {
  for (const s of io.sockets.sockets.values()) {
    s.emit("game:state", game.view(s.data.pid as string | undefined));
  }
}

/** Motor bir istisna fırlatırsa süreç ölmesin; hatayı oyuncuya bildir */
function handle(socket: Socket, fn: () => string | null | void) {
  try {
    const err = fn();
    if (err) socket.emit("error", { message: err }); else broadcast();
  } catch (e) {
    console.error("Oyun hatası:", e);
    socket.emit("error", { message: "Beklenmeyen bir hata oluştu" });
    broadcast();
  }
}

io.on("connection", (socket) => {
  socket.emit("game:state", game.view());
  socket.emit("voice:roster", [...voice]);

  socket.on("join", ({ name, device }: { name: string; device?: string }) => {
    try {
      const r = game.join(String(name ?? ""), device ? String(device).slice(0, 100) : undefined);
      if ("error" in r) return socket.emit("error", { message: r.error });
      socket.data.pid = r.pid;
      activeSocket.set(r.pid, socket.id);
      broadcast();
    } catch (e) {
      console.error("Katılım hatası:", e);
      socket.emit("error", { message: "Katılım başarısız" });
    }
  });

  const pid = () => socket.data.pid as string | undefined;

  socket.on("chat:send", ({ text }: { text: string }) => {
    if (!pid()) return;
    game.sendChat(pid()!, String(text ?? ""));
    broadcast();
  });

  socket.on("game:start", () => handle(socket, () => pid() ? game.start() : "Önce katıl"));
  socket.on("game:reset", () => handle(socket, () => pid() ? game.reset() : "Önce katıl"));

  socket.on("game:bank", ({ cardId }: { cardId: string }) =>
    handle(socket, () => game.bank(pid() ?? "", cardId)));

  socket.on("game:property", ({ cardId, color }: { cardId: string; color?: string }) =>
    handle(socket, () => game.property(pid() ?? "", cardId, color as PlayActionParams["targetColor"])));

  socket.on("game:action", (p: PlayActionParams) =>
    handle(socket, () => game.action(pid() ?? "", p ?? { cardId: "" })));

  socket.on("game:pay", ({ cardIds }: { cardIds: string[] }) =>
    handle(socket, () => game.pay(pid() ?? "", Array.isArray(cardIds) ? cardIds : [])));

  socket.on("game:justSayNo", ({ cardId }: { cardId: string }) =>
    handle(socket, () => game.justSayNo(pid() ?? "", cardId)));

  socket.on("game:acceptSteal", () =>
    handle(socket, () => game.acceptSteal(pid() ?? "")));

  socket.on("game:acceptPayChallenge", () =>
    handle(socket, () => game.acceptPayChallenge(pid() ?? "")));

  socket.on("game:moveWild", ({ propertyId, color }: { propertyId: string; color: string }) =>
    handle(socket, () => game.moveWild(pid() ?? "", propertyId, color as PlayActionParams["targetColor"] & string)));

  socket.on("game:endTurn", ({ discardIds }: { discardIds: string[] }) =>
    handle(socket, () => game.endTurn(pid() ?? "", Array.isArray(discardIds) ? discardIds : [])));

  // ─── Sesli sohbet sinyalleşmesi (WebRTC) ───

  socket.on("voice:join", () => {
    const id = pid(); if (!id) return;
    // Yeni gelen, halihazırdakilere teklif gönderir — böylece iki taraf aynı anda teklif göndermez
    socket.emit("voice:peers", [...voice].filter(x => x !== id));
    voice.add(id);
    broadcastVoice();
  });

  socket.on("voice:leave", () => {
    const id = pid(); if (!id) return;
    voice.delete(id);
    socket.broadcast.emit("voice:left", { id });
    broadcastVoice();
  });

  socket.on("voice:signal", ({ to, data }: { to: string; data: unknown }) => {
    const id = pid(); if (!id || !to) return;
    socketOf(to)?.emit("voice:signal", { from: id, data });
  });

  socket.on("disconnect", () => {
    const id = pid();
    if (!id) return;
    // Aynı oyuncu bu arada yeni bir sokete geçtiyse (ağ kopması sonrası hızlı dönüş) bu kopuş sayılmaz
    if (activeSocket.get(id) !== socket.id) return;
    activeSocket.delete(id);
    if (voice.delete(id)) { io.emit("voice:left", { id }); broadcastVoice(); }
    game.disconnect(id);
    broadcast();
  });
});

httpServer.listen(PORT, HOST, () => {
  console.log(`Backend ${HOST}:${PORT}`);
  console.log(`İzin verilen adresler: ${ALLOWED_ORIGINS.join(", ")}`);
  console.log(`Oyuncu aralığı: ${MIN_PLAYERS}-${MAX_PLAYERS} | İsimler: ${loadAllowedNames().join(", ")}`);
});
