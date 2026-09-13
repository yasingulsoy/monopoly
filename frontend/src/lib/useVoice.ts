"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";

/**
 * 4 kişilik "mesh" sesli sohbet: herkes diğer herkese doğrudan bağlanır.
 * Ses sunucudan geçmez — sunucu yalnızca bağlantı kurulurken mesaj taşır.
 *
 * STUN, iki tarafın birbirinin dış IP'sini öğrenmesini sağlar. Her iki taraf da
 * mobil internetteyse (CGNAT) doğrudan bağlantı kurulamaz; o durumda TURN devreye
 * girip sesi aktarır. Evden bağlananlar TURN'e hiç ihtiyaç duymaz.
 */
function iceServers(): RTCIceServer[] {
  const list: RTCIceServer[] = [
    { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
  ];
  const url = process.env.NEXT_PUBLIC_TURN_URL;
  if (url) {
    list.push({
      urls: url.split(",").map(u => u.trim()).filter(Boolean),
      username: process.env.NEXT_PUBLIC_TURN_USER,
      credential: process.env.NEXT_PUBLIC_TURN_PASS,
    });
  } else {
    // Metered Open Relay — ücretsiz genel TURN (aylık kota var)
    list.push({
      urls: ["turn:openrelay.metered.ca:80", "turn:openrelay.metered.ca:443"],
      username: "openrelayproject",
      credential: "openrelayproject",
    });
  }
  return list;
}

type Signal = { sdp?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit };

export function useVoice(socket: Socket | null, myId?: string) {
  const [inVoice, setInVoice] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [muted, setMuted] = useState(false);
  const [roster, setRoster] = useState<string[]>([]);
  const [streams, setStreams] = useState<Map<string, MediaStream>>(new Map());
  const [speaking, setSpeaking] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const local = useRef<MediaStream | null>(null);
  const pcs = useRef(new Map<string, RTCPeerConnection>());
  const pending = useRef(new Map<string, RTCIceCandidateInit[]>());
  const analysers = useRef(new Map<string, AnalyserNode>());
  const audioCtx = useRef<AudioContext | null>(null);
  const inVoiceRef = useRef(false);

  const analyse = useCallback((id: string, stream: MediaStream) => {
    try {
      audioCtx.current ??= new AudioContext();
      const an = audioCtx.current.createAnalyser();
      an.fftSize = 512;
      audioCtx.current.createMediaStreamSource(stream).connect(an);
      analysers.current.set(id, an);
    } catch { /* ses analizi kritik değil */ }
  }, []);

  const closePeer = useCallback((id: string) => {
    pcs.current.get(id)?.close();
    pcs.current.delete(id);
    pending.current.delete(id);
    analysers.current.delete(id);
    setStreams(m => { const n = new Map(m); n.delete(id); return n; });
  }, []);

  const makePeer = useCallback((peerId: string) => {
    const pc = new RTCPeerConnection({ iceServers: iceServers() });
    local.current?.getTracks().forEach(t => pc.addTrack(t, local.current!));

    pc.onicecandidate = e => {
      if (e.candidate) socket?.emit("voice:signal", { to: peerId, data: { candidate: e.candidate } });
    };
    pc.ontrack = e => {
      const s = e.streams[0];
      if (!s) return;
      setStreams(m => new Map(m).set(peerId, s));
      analyse(peerId, s);
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed") closePeer(peerId);
    };

    pcs.current.set(peerId, pc);
    return pc;
  }, [socket, analyse, closePeer]);

  const teardown = useCallback(() => {
    for (const id of [...pcs.current.keys()]) closePeer(id);
    local.current?.getTracks().forEach(t => t.stop());
    local.current = null;
    analysers.current.clear();
    audioCtx.current?.close().catch(() => {});
    audioCtx.current = null;
    setStreams(new Map());
    setSpeaking(new Set());
    setMuted(false);
  }, [closePeer]);

  const join = useCallback(async () => {
    if (!socket || inVoiceRef.current || connecting) return;
    setError(null); setConnecting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      local.current = stream;
      if (myId) analyse(myId, stream);
      inVoiceRef.current = true;
      setInVoice(true);
      socket.emit("voice:join");
    } catch (e) {
      const err = e as DOMException;
      setError(
        err?.name === "NotAllowedError" ? "Mikrofon izni verilmedi"
          : err?.name === "NotFoundError" ? "Mikrofon bulunamadı"
            : "Mikrofon açılamadı (sayfa https olmalı)"
      );
    } finally {
      setConnecting(false);
    }
  }, [socket, connecting, myId, analyse]);

  const leave = useCallback(() => {
    if (!inVoiceRef.current) return;
    inVoiceRef.current = false;
    setInVoice(false);
    socket?.emit("voice:leave");
    teardown();
  }, [socket, teardown]);

  const toggleMute = useCallback(() => {
    const track = local.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMuted(!track.enabled);
  }, []);

  // ─── Sinyalleşme ───
  useEffect(() => {
    if (!socket) return;

    const onRoster = (ids: string[]) => setRoster(ids);

    // Sese yeni katıldık: mevcut herkese teklif gönderiyoruz
    const onPeers = async (ids: string[]) => {
      for (const id of ids) {
        try {
          const pc = makePeer(id);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit("voice:signal", { to: id, data: { sdp: pc.localDescription } });
        } catch { closePeer(id); }
      }
    };

    const onSignal = async ({ from, data }: { from: string; data: Signal }) => {
      if (!inVoiceRef.current) return;
      try {
        if (data.sdp) {
          let pc = pcs.current.get(from);
          if (data.sdp.type === "offer") {
            pc ??= makePeer(from);
            await pc.setRemoteDescription(data.sdp);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit("voice:signal", { to: from, data: { sdp: pc.localDescription } });
          } else if (pc && !pc.currentRemoteDescription) {
            await pc.setRemoteDescription(data.sdp);
          }
          // Açıklama gelmeden önce biriken adayları şimdi ekle
          const buf = pending.current.get(from);
          if (buf && pc) {
            for (const c of buf) await pc.addIceCandidate(c).catch(() => {});
            pending.current.delete(from);
          }
        } else if (data.candidate) {
          const pc = pcs.current.get(from);
          if (pc?.remoteDescription) await pc.addIceCandidate(data.candidate).catch(() => {});
          else pending.current.set(from, [...(pending.current.get(from) ?? []), data.candidate]);
        }
      } catch { /* tek bir sinyal hatası bağlantıyı bozmasın */ }
    };

    const onLeft = ({ id }: { id: string }) => closePeer(id);

    socket.on("voice:roster", onRoster);
    socket.on("voice:peers", onPeers);
    socket.on("voice:signal", onSignal);
    socket.on("voice:left", onLeft);
    return () => {
      socket.off("voice:roster", onRoster);
      socket.off("voice:peers", onPeers);
      socket.off("voice:signal", onSignal);
      socket.off("voice:left", onLeft);
    };
  }, [socket, makePeer, closePeer]);

  // ─── Kim konuşuyor ───
  useEffect(() => {
    if (!inVoice) return;
    const buf = new Uint8Array(512);
    const t = setInterval(() => {
      const now = new Set<string>();
      for (const [id, an] of analysers.current) {
        an.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; sum += v * v; }
        if (Math.sqrt(sum / buf.length) > 0.045) now.add(id);
      }
      if (muted && myId) now.delete(myId);
      setSpeaking(prev => {
        if (prev.size === now.size && [...now].every(x => prev.has(x))) return prev;
        return now;
      });
    }, 150);
    return () => clearInterval(t);
  }, [inVoice, muted, myId]);

  // Sekme kapanırken diğerleri anında haberdar olsun
  useEffect(() => {
    const bye = () => { if (inVoiceRef.current) socket?.emit("voice:leave"); };
    window.addEventListener("pagehide", bye);
    return () => { window.removeEventListener("pagehide", bye); bye(); teardown(); };
  }, [socket, teardown]);

  return { inVoice, connecting, muted, roster, streams, speaking, error, join, leave, toggleMute, clearError: () => setError(null) };
}
