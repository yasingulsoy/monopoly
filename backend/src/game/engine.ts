import { createDeck, shuffle } from "./deck.js";
import type { CardInstance, PaymentRequest, PlacedProperty, PlayActionParams, PropertyColor } from "./types.js";
import { BUILDABLE, LABELS, SETS } from "./types.js";

interface Player {
  id: string; name: string; hand: CardInstance[]; bank: CardInstance[];
  properties: PlacedProperty[];
  /** Ev/Otel gerçek kart olarak tutulur — ödeme için verilebilmeleri gerekir */
  buildings: Partial<Record<PropertyColor, { house?: CardInstance; hotel?: CardInstance }>>;
  connected: boolean;
}

interface PendingSteal {
  id: string;
  type: "sly_deal" | "forced_deal" | "deal_breaker";
  fromPlayerId: string;
  targetPlayerId: string;
  theirPropertyId?: string;
  myPropertyId?: string;
  setColor?: PropertyColor;
  noCount: number;
  awaitingId: string;
}

interface PendingPayChallenge {
  paymentId: string;
  noCount: number;
  awaitingId: string;
  debtorId: string;
  creditorId: string;
}

let logId = 0, payId = 0, chatId = 0, stealId = 0;

/** Oyuncu kimliği isimden türetilir — socket değişse de (yeniden bağlanma) sabit kalır. */
const slug = (name: string) => name.trim().toLowerCase();

export class Game {
  phase: "lobby" | "playing" | "finished" = "lobby";
  players: Player[] = [];
  order: string[] = [];
  turnIdx = 0;
  playsLeft = 0;
  drawPile: CardInstance[] = [];
  discard: CardInstance[] = [];
  winnerName: string | null = null;
  logs: { id: string; message: string }[] = [];
  announcement: string | null = null;
  chat: { id: string; playerName: string; text: string; timestamp: number }[] = [];
  payQueue: PaymentRequest[] = [];
  activePay: string | null = null;
  pendingSteal: PendingSteal | null = null;
  pendingPayChallenge: PendingPayChallenge | null = null;
  pendingRent: { from: string; color: PropertyColor; amount: number; type: "all"|"one"; to?: string; doubled: boolean } | null = null;

  /**
   * Cihaz kimliği → oyuncu. Bir tarayıcıdan yalnızca tek oyuncu oynayabilir;
   * ikinci sekmeden başka bir isimle girilmesini engeller.
   * (IP'ye bakmıyoruz — aynı wifi'deki farklı cihazlar engellenmemeli.)
   */
  private devices = new Map<string, string>();

  constructor(
    public allowedNames: string[],
    public minPlayers: number = 2,
    public maxPlayers: number = 5,
  ) {
    this.log(`Lobiye hoş geldiniz! Oyun ${minPlayers}-${maxPlayers} oyuncu ile oynanır.`);
  }

  private log(msg: string) {
    this.logs.push({ id: `l${logId++}`, message: msg });
    if (this.logs.length > 60) this.logs.shift();
  }

  private announce(msg: string) {
    this.announcement = msg;
    this.log(msg);
  }
  private p(id: string) { return this.players.find(x => x.id === id); }
  private cur() { return this.p(this.order[this.turnIdx]); }

  // ─── LOBBY ───

  /**
   * Oyuncuyu ismiyle kaydeder ve sabit kimliğini döndürür.
   * Aynı isimle tekrar gelen (yeniden bağlanan) oyuncu mevcut kaydına geri döner.
   */
  join(name: string, device?: string): { pid: string } | { error: string } {
    const trimmed = name.trim();
    if (!trimmed) return { error: "İsim gerekli" };
    const pid = slug(trimmed);
    if (!this.allowedNames.map(slug).includes(pid)) {
      return { error: `Geçersiz isim. İzin verilen: ${this.allowedNames.join(", ")}` };
    }

    // Bu cihaz başka bir oyuncuya bağlıysa ve o oyuncu hâlâ oyundaysa, isim değiştirilemez
    if (device) {
      const bound = this.devices.get(device);
      const boundPlayer = bound ? this.p(bound) : undefined;
      if (bound && bound !== pid && boundPlayer) {
        return { error: `Bu cihazdan zaten ${boundPlayer.name} olarak oynuyorsun. Başka bir oyuncu için farklı cihaz kullanın.` };
      }
    }

    const existing = this.p(pid);
    if (existing) {
      const wasConnected = existing.connected;
      existing.connected = true;
      if (device) this.devices.set(device, pid);
      this.log(wasConnected ? `${existing.name} başka bir cihazdan bağlandı` : `${existing.name} tekrar bağlandı`);
      return { pid };
    }

    if (this.phase !== "lobby") return { error: "Oyun başlamış — sadece oyundaki oyuncular kendi adıyla geri dönebilir" };
    if (this.players.filter(x => x.connected).length >= this.maxPlayers) {
      return { error: `Oda dolu (max ${this.maxPlayers} oyuncu)` };
    }
    this.players.push({ id: pid, name: trimmed, hand: [], bank: [], properties: [], buildings: {}, connected: true });
    if (device) this.devices.set(device, pid);
    this.log(`${trimmed} katıldı (${this.players.filter(x => x.connected).length}/${this.maxPlayers})`);
    return { pid };
  }

  /** Bağlantı kopunca oyunun kilitlenmemesi için o oyuncuyu bekleyen her şeyi çözer. */
  disconnect(pid: string) {
    const p = this.p(pid);
    if (!p) return;
    p.connected = false;
    this.log(`${p.name} bağlantısı koptu`);

    // Lobide bekleyen biri koptuysa listeden çıkar; geri gelirse yeniden katılır
    if (this.phase === "lobby") { this.players = this.players.filter(x => x.connected); return; }
    if (this.phase !== "playing") return;

    // Cevap vermesi beklenen bir çalma varsa otomatik kabul say
    if (this.pendingSteal?.awaitingId === pid) {
      const cancelled = this.pendingSteal.noCount % 2 === 1;
      if (!cancelled) this.executeSteal(this.pendingSteal);
      this.pendingSteal = null;
    }

    // Reddet zincirinin iki tarafından biri koptuysa zinciri olduğu haliyle sonuçlandır
    const ppc = this.pendingPayChallenge;
    if (ppc && (ppc.awaitingId === pid || ppc.debtorId === pid || ppc.creditorId === pid)) {
      this.resolvePayChallenge();
    }

    // Kopan oyuncunun borçları (aktif ya da sırada) düşer — aksi halde kuyruk kilitlenir
    for (const req of this.payQueue.filter(x => x.fromPlayerId === pid)) {
      this.log(`${p.name} çevrimdışı — ${req.amount}M borcu düştü`);
      this.finishPay(req);
    }

    if (this.pendingRent?.from === pid) this.pendingRent = null;

    if (this.cur()?.id === pid) this.advanceTurn();
  }

  sendChat(sid: string, text: string) {
    const p = this.p(sid); if (!p || !text.trim()) return;
    this.chat.push({ id: `c${chatId++}`, playerName: p.name, text: text.trim().slice(0, 300), timestamp: Date.now() });
    if (this.chat.length > 80) this.chat.shift();
  }

  // ─── GAME START / RESET ───

  start(): string | null {
    if (this.phase !== "lobby") return "Zaten başladı";
    const active = this.players.filter(p => p.connected);
    if (active.length < this.minPlayers) {
      return `En az ${this.minPlayers} oyuncu gerekli (şu an ${active.length})`;
    }
    if (active.length > this.maxPlayers) {
      return `En fazla ${this.maxPlayers} oyuncu olabilir`;
    }
    this.players = active;
    for (const p of this.players) { p.hand = []; p.bank = []; p.properties = []; p.buildings = {}; }
    this.order = active.map(p => p.id);
    this.drawPile = shuffle(createDeck());
    this.discard = [];
    this.winnerName = null;
    this.phase = "playing";
    for (const id of this.order) this.deal(id, 5);
    this.turnIdx = 0;
    this.beginTurn();
    this.announce(`🎮 Oyun başladı! ${active.length} oyuncu: ${active.map(p => p.name).join(", ")}`);
    return null;
  }

  /** Oyun bittikten (ya da yarıda bırakıldıktan) sonra aynı oyuncularla lobiye döner. */
  reset(): string | null {
    if (this.phase === "lobby") return "Zaten lobidesiniz";
    this.phase = "lobby";
    this.order = []; this.turnIdx = 0; this.playsLeft = 0;
    this.drawPile = []; this.discard = []; this.winnerName = null;
    this.payQueue = []; this.activePay = null;
    this.pendingSteal = null; this.pendingPayChallenge = null; this.pendingRent = null;
    this.announcement = null;
    this.players = this.players.filter(p => p.connected);
    for (const p of this.players) { p.hand = []; p.bank = []; p.properties = []; p.buildings = {}; }
    this.log("🔄 Yeni oyun için lobiye dönüldü");
    return null;
  }

  // ─── TURN MANAGEMENT ───

  private beginTurn() {
    const p = this.cur(); if (!p) return;
    this.deal(p.id, p.hand.length === 0 ? 5 : 2);
    this.playsLeft = 3;
    this.pendingRent = null;
    this.log(`${p.name} turuna başladı`);
  }

  /** Sıradaki bağlı oyuncuyu bulup turunu başlatır */
  private advanceTurn() {
    const n = this.order.length;
    for (let i = 1; i <= n; i++) {
      const idx = (this.turnIdx + i) % n;
      const pl = this.p(this.order[idx]);
      if (pl?.connected) {
        this.turnIdx = idx;
        this.beginTurn();
        return;
      }
    }
    this.log("Bağlı oyuncu kalmadı!");
  }

  private deal(pid: string, n: number) {
    const p = this.p(pid)!;
    for (let i = 0; i < n; i++) {
      if (!this.drawPile.length && this.discard.length) { this.drawPile = shuffle(this.discard); this.discard = []; }
      const c = this.drawPile.pop(); if (c) p.hand.push(c);
    }
  }

  private rmHand(p: Player, cid: string) {
    const i = p.hand.findIndex(c => c.instanceId === cid);
    return i >= 0 ? p.hand.splice(i, 1)[0] : null;
  }

  private usePlay() { if (this.playsLeft > 0) this.playsLeft--; }

  /** Hedef alınan rakip geçerli mi? (var, bağlı, kendisi değil) */
  private targetError(sid: string, targetId?: string): string | null {
    if (!targetId) return "Rakip seç";
    const o = this.p(targetId);
    if (!o || !this.order.includes(o.id)) return "Oyuncu yok";
    if (o.id === sid) return "Kendini seçemezsin";
    if (!o.connected) return `${o.name} çevrimdışı — ona hamle yapılamaz`;
    return null;
  }

  // ─── RENT ───

  private flushRent() {
    if (!this.pendingRent) return;
    const { from, color, amount, type, to, doubled } = this.pendingRent;
    const rent = doubled ? amount * 2 : amount;
    const fromName = this.p(from)?.name ?? "?";

    if (type === "all") {
      this.announce(
        doubled
          ? `💰 ${fromName}, ${LABELS[color]} setinden HERKESTEN ${rent}M kira istiyor! (x2)`
          : `💰 ${fromName}, ${LABELS[color]} setinden HERKESTEN ${rent}M kira istiyor!`
      );
      for (const p of this.players) if (p.id !== from && this.order.includes(p.id)) this.queuePay(p.id, from, rent, `${fromName} — ${LABELS[color]} kirası`);
    } else if (to) {
      const toName = this.p(to)?.name ?? "?";
      this.announce(
        doubled
          ? `💰 ${fromName}, ${toName}'den ${LABELS[color]} kirası olarak ${rent}M istiyor! (x2)`
          : `💰 ${fromName}, ${toName}'den ${LABELS[color]} kirası olarak ${rent}M istiyor!`
      );
      this.queuePay(to, from, rent, `${fromName} — ${LABELS[color]} kirası`);
    }
    this.pendingRent = null;
  }

  // ─── PLAY ACTIONS ───

  bank(sid: string, cid: string): string | null {
    if (!this.canAct(sid)) return "Oynayamazsın";
    const p = this.cur()!;
    const card = p.hand.find(x => x.instanceId === cid);
    if (!card) return "Kart yok";
    // Sadece para ve aksiyon kartları bankaya konabilir; mülk/joker mülk olarak oynanmalı
    if (card.kind === "property" || card.kind === "wild_property") return "Mülk kartı bankaya konamaz — mülk olarak oyna";
    if (this.pendingRent?.from === sid) this.flushRent();
    const c = this.rmHand(p, cid)!;
    p.bank.push(c); this.usePlay(); this.log(`${p.name} bankaya ${c.displayName} koydu`);
    return null;
  }

  property(sid: string, cid: string, color?: PropertyColor): string | null {
    if (!this.canAct(sid)) return "Oynayamazsın";
    const p = this.cur()!;
    // Önce doğrula, sonra elden çıkar — geçersiz istekte kart kaybolmasın
    const c = p.hand.find(x => x.instanceId === cid);
    if (!c || (c.kind !== "property" && c.kind !== "wild_property")) return "Mülk değil";
    let col = color ?? c.color;
    if (c.kind === "wild_property" && !col) return "Renk seç";
    if (c.colors && col && !c.isMultiWild && !c.colors.includes(col)) col = c.colors[0];
    if (!col) return "Renk gerekli";
    if (this.pendingRent?.from === sid) this.flushRent();
    this.rmHand(p, cid);
    p.properties.push({ instanceId: c.instanceId, assignedColor: col, kind: c.kind, displayName: c.displayName, bankValue: c.bankValue, isMultiWild: c.isMultiWild, colors: c.colors });
    this.usePlay(); this.log(`${p.name} → ${LABELS[col]}: ${c.displayName}`);
    this.checkWin(p); return null;
  }

  /** Jokeri setler arasında taşımak ücretsizdir, hamle hakkı harcamaz */
  moveWild(sid: string, propertyId: string, newColor: PropertyColor): string | null {
    if (this.phase !== "playing") return "Oyun aktif değil";
    if (this.cur()?.id !== sid) return "Senin turun değil";
    const p = this.p(sid)!;
    const prop = p.properties.find(x => x.instanceId === propertyId);
    if (!prop) return "Mülk bulunamadı";
    if (prop.kind !== "wild_property") return "Sadece joker kartlar taşınabilir";
    if (!prop.isMultiWild && prop.colors && !prop.colors.includes(newColor)) return "Bu renk bu jokerde yok";
    if (prop.assignedColor === newColor) return "Zaten bu renkte";
    const oldColor = prop.assignedColor;
    prop.assignedColor = newColor;
    this.log(`${p.name} jokeri ${LABELS[oldColor]} → ${LABELS[newColor]} taşıdı`);
    this.checkWin(p); // taşıma 3. seti tamamlayabilir
    return null;
  }

  action(sid: string, params: PlayActionParams): string | null {
    const p = this.p(sid); if (!p) return "Oyuncu yok";
    const c = p.hand.find(x => x.instanceId === params.cardId);
    if (!c) return "Kart yok";

    // Reddet tur dışında da oynanır ve hamle hakkı harcamaz; bekleyen bir hamle yoksa kart yanmaz
    if (c.kind === "just_say_no") return this.justSayNo(sid, c.instanceId);

    if (this.activePay) return "Önce ödemeler tamamlanmalı";
    if (this.pendingPayChallenge) return "Reddet zinciri devam ediyor";
    if (c.kind !== "double_rent" && this.pendingRent?.from === sid) this.flushRent();
    if (!this.canAct(sid)) return "Oynayamazsın";

    switch (c.kind) {
      // Önce çek, sonra ıskartaya at: deste biterse deal() ıskartayı karıştırır,
      // kart önceden atılmış olsaydı oyuncu kendi kartını geri çekebilirdi.
      case "pass_go": this.rmHand(p,c.instanceId); this.deal(sid,2); this.discard.push(c); this.usePlay(); this.log(`${p.name} 2 kart çekti`); break;
      case "double_rent":
        if (!this.pendingRent || this.pendingRent.from !== sid) return "Önce kira oyna";
        this.rmHand(p,c.instanceId); this.discard.push(c); this.pendingRent.doubled = true;
        this.announce(`⚡ ${p.name} Kirayı Katla oynadı!`);
        this.flushRent(); this.usePlay(); break;
      case "house": case "hotel": {
        const col = params.setColor; if (!col || !BUILDABLE.includes(col)) return "Set seç";
        if (!this.complete(p, col)) return "Set tam değil";
        const b = p.buildings[col] ?? {};
        if (c.kind === "house" && b.house) return "Ev var";
        if (c.kind === "hotel" && (!b.house || b.hotel)) return "Önce ev gerekli";
        this.rmHand(p,c.instanceId);
        p.buildings[col] = c.kind === "house" ? { ...b, house: c } : { ...b, hotel: c };
        this.usePlay(); this.log(`${p.name} ${LABELS[col]}'e ${c.displayName} koydu`); break;
      }
      case "rent_dual": {
        const col = params.targetColor; if (!col || !c.colors?.includes(col)) return "Renk seç";
        const rent = this.rent(p, col); this.rmHand(p,c.instanceId); this.discard.push(c); this.usePlay();
        if (rent === 0) { this.log(`${p.name} kira istedi ama ${LABELS[col]} mülkü yok`); break; }
        this.pendingRent = { from: sid, color: col, amount: rent, type: "all", doubled: false };
        this.log(`${p.name} ${LABELS[col]} kira kartı oynadı (${rent}M)`); break;
      }
      case "rent_any": {
        const col = params.targetColor, to = params.targetPlayerId;
        if (!col) return "Renk seç";
        const te = this.targetError(sid, to); if (te) return te;
        const rent = this.rent(p, col); this.rmHand(p,c.instanceId); this.discard.push(c); this.usePlay();
        if (rent === 0) { this.log(`${p.name} kira istedi ama ${LABELS[col]} mülkü yok`); break; }
        this.pendingRent = { from: sid, color: col, amount: rent, type: "one", to, doubled: false };
        this.log(`${p.name} Joker Kira oynadı`); break;
      }
      case "debt_collector": {
        const to = params.targetPlayerId;
        const te = this.targetError(sid, to); if (te) return te;
        const toName = this.p(to!)!.name;
        this.rmHand(p,c.instanceId); this.discard.push(c); this.usePlay();
        this.announce(`💸 ${p.name}, ${toName}'den Borç Tahsildarı ile 5M istiyor!`);
        this.queuePay(to!, sid, 5, `${p.name} — Borç Tahsildarı`); break;
      }
      case "birthday":
        this.rmHand(p,c.instanceId); this.discard.push(c); this.usePlay();
        this.announce(`🎂 ${p.name} Doğum Günüm kutluyor — herkesten 2M istiyor!`);
        for (const o of this.players) if (o.id !== sid && this.order.includes(o.id)) this.queuePay(o.id, sid, 2, `${p.name} — Doğum Günüm`); break;
      case "sly_deal": {
        const to = params.targetPlayerId, prop = params.theirPropertyId;
        const te = this.targetError(sid, to); if (te) return te;
        if (!prop) return "Mülk seç";
        const o = this.p(to!)!, pr = o.properties.find(x => x.instanceId === prop);
        if (!pr) return "Mülk yok";
        if (this.complete(o, pr.assignedColor)) return "Tam setten alınamaz";
        this.rmHand(p,c.instanceId); this.discard.push(c); this.usePlay();
        this.pendingSteal = { id: `st${stealId++}`, type: "sly_deal", fromPlayerId: sid, targetPlayerId: o.id, theirPropertyId: prop, noCount: 0, awaitingId: o.id };
        this.announce(`📜 ${p.name}, ${o.name}'den ${pr.displayName} tapusunu devralmak istiyor!`);
        break;
      }
      case "forced_deal": {
        const to = params.targetPlayerId, mine = params.myPropertyId, theirs = params.theirPropertyId;
        const te = this.targetError(sid, to); if (te) return te;
        if (!mine || !theirs) return "Mülkleri seç";
        const o = this.p(to!)!;
        const mp = p.properties.find(x => x.instanceId === mine), tp = o.properties.find(x => x.instanceId === theirs);
        if (!mp || !tp) return "Mülk bulunamadı";
        if (this.complete(o, tp.assignedColor)) return "Tam setten alınamaz";
        this.rmHand(p,c.instanceId); this.discard.push(c); this.usePlay();
        this.pendingSteal = { id: `st${stealId++}`, type: "forced_deal", fromPlayerId: sid, targetPlayerId: o.id, theirPropertyId: theirs, myPropertyId: mine, noCount: 0, awaitingId: o.id };
        this.announce(`🔄 ${p.name}, ${o.name} ile değiş tokuş yapmak istiyor!`);
        break;
      }
      case "deal_breaker": {
        const to = params.targetPlayerId, col = params.targetColor;
        const te = this.targetError(sid, to); if (te) return te;
        if (!col) return "Set seç";
        const o = this.p(to!)!; if (!this.complete(o, col)) return "Set tam değil";
        this.rmHand(p,c.instanceId); this.discard.push(c); this.usePlay();
        this.pendingSteal = { id: `st${stealId++}`, type: "deal_breaker", fromPlayerId: sid, targetPlayerId: o.id, setColor: col, noCount: 0, awaitingId: o.id };
        this.announce(`⚖️ ${p.name}, ${o.name}'in ${LABELS[col]} setine HACİZ koyuyor!`);
        break;
      }
      default: return "Oynanamaz";
    }
    return null;
  }

  // ─── REDDET (zincir: hem çalma hem ödeme için) ───

  justSayNo(sid: string, cardId: string): string | null {
    const p = this.p(sid); if (!p) return "Oyuncu yok";
    const c = p.hand.find(x => x.instanceId === cardId && x.kind === "just_say_no");
    if (!c) return "Reddet kartın yok";

    // Bekleyen çalma zinciri
    if (this.pendingSteal && this.pendingSteal.awaitingId === sid) {
      this.rmHand(p, c.instanceId); this.discard.push(c);
      this.pendingSteal.noCount++;
      const other = this.pendingSteal.noCount % 2 === 1 ? this.pendingSteal.fromPlayerId : this.pendingSteal.targetPlayerId;
      this.pendingSteal.awaitingId = other;
      this.announce(`🚫 ${p.name} "REDDET!" dedi!`);
      return null;
    }

    // Ödeme zincirine karşılık
    if (this.pendingPayChallenge && this.pendingPayChallenge.awaitingId === sid) {
      this.rmHand(p, c.instanceId); this.discard.push(c);
      this.pendingPayChallenge.noCount++;
      const other = this.pendingPayChallenge.noCount % 2 === 1
        ? this.pendingPayChallenge.creditorId
        : this.pendingPayChallenge.debtorId;
      this.pendingPayChallenge.awaitingId = other;
      this.announce(`🚫 ${p.name} "REDDET!" dedi!`);
      return null;
    }

    // Yeni ödeme zinciri: borçlu aktif ödemeyi reddediyor
    const req = this.payQueue.find(x => x.id === this.activePay);
    if (req && req.fromPlayerId === sid && !this.pendingPayChallenge) {
      this.rmHand(p, c.instanceId); this.discard.push(c);
      this.pendingPayChallenge = {
        paymentId: req.id,
        noCount: 1,
        awaitingId: req.toPlayerId,
        debtorId: req.fromPlayerId,
        creditorId: req.toPlayerId,
      };
      this.announce(`🚫 ${p.name} ödemeyi REDDETTİ! ${this.p(req.toPlayerId)?.name ?? "?"} karşılık verebilir...`);
      return null;
    }

    return "Şu an reddedilecek bir hamle yok — Reddet'i bankaya (4M) koyabilirsin";
  }

  acceptPayChallenge(sid: string): string | null {
    if (!this.pendingPayChallenge || this.pendingPayChallenge.awaitingId !== sid) return "Bekleyen zincir yok";
    this.resolvePayChallenge();
    return null;
  }

  private resolvePayChallenge() {
    if (!this.pendingPayChallenge) return;
    const ppc = this.pendingPayChallenge;
    const cancelled = ppc.noCount % 2 === 1; // tek sayı = borçlunun reddi geçerli
    this.pendingPayChallenge = null;

    const req = this.payQueue.find(x => x.id === ppc.paymentId);
    if (!req) return;

    if (cancelled) {
      this.log(`${this.p(ppc.debtorId)?.name ?? "?"} ödemeyi başarıyla reddetti`);
      this.finishPay(req);
    } else {
      this.log(`Reddet iptal edildi — ödeme devam ediyor`);
    }
  }

  // ─── ÇALMA KABUL / UYGULA ───

  acceptSteal(sid: string): string | null {
    if (!this.pendingSteal || this.pendingSteal.awaitingId !== sid) return "Bekleyen işlem yok";
    const ps = this.pendingSteal;
    const cancelled = ps.noCount % 2 === 1;
    this.pendingSteal = null;

    if (cancelled) {
      this.log(`İşlem iptal edildi`);
      return null;
    }

    this.executeSteal(ps);
    return null;
  }

  private executeSteal(ps: PendingSteal) {
    const from = this.p(ps.fromPlayerId), target = this.p(ps.targetPlayerId);
    if (!from || !target) return;

    if (ps.type === "sly_deal" && ps.theirPropertyId) {
      const i = target.properties.findIndex(x => x.instanceId === ps.theirPropertyId);
      if (i >= 0) { from.properties.push(...target.properties.splice(i, 1)); }
      this.announce(`📜 ${from.name}, ${target.name}'den tapuyu devraldı!`);
      this.checkWin(from);
    } else if (ps.type === "forced_deal" && ps.myPropertyId && ps.theirPropertyId) {
      const mi = from.properties.findIndex(x => x.instanceId === ps.myPropertyId);
      const ti = target.properties.findIndex(x => x.instanceId === ps.theirPropertyId);
      if (mi >= 0 && ti >= 0) {
        const sw = [from.properties.splice(mi, 1)[0], target.properties.splice(ti, 1)[0]];
        from.properties.push(sw[1]); target.properties.push(sw[0]);
      }
      this.announce(`🔄 ${from.name} ile ${target.name} değiş tokuş yaptı!`);
      this.checkWin(from); this.checkWin(target);
    } else if (ps.type === "deal_breaker" && ps.setColor) {
      const col = ps.setColor;
      const stolen = target.properties.filter(x => x.assignedColor === col);
      target.properties = target.properties.filter(x => x.assignedColor !== col);
      from.properties.push(...stolen);
      if (target.buildings[col]) { from.buildings[col] = target.buildings[col]; delete target.buildings[col]; }
      this.announce(`⚖️ ${from.name}, ${target.name}'in ${LABELS[col]} setine HACİZ uyguladı!`);
      this.checkWin(from);
    }
  }

  // ─── ÖDEME ───

  pay(sid: string, cardIds: string[]): string | null {
    if (this.pendingPayChallenge) return "Reddet zinciri devam ediyor";
    const req = this.payQueue.find(x => x.id === this.activePay);
    if (!req || req.fromPlayerId !== sid) return "Ödeme yok";
    const p = this.p(sid)!;
    const cr = this.p(req.toPlayerId);
    if (!cr) { this.finishPay(req); return null; } // alacaklı oyundan çıkmış

    const wealth = this.payable(p);
    // Ödenebilir hiç varlık yoksa borç silinir
    if (wealth === 0) { this.finishPay(req); return null; }

    // Seçimi doğrula ve topla — yalnızca ödenebilir kartlar (joker mülk hariç) sayılır
    const ids = new Set(cardIds);
    const builds = this.payableBuildings(p);
    let sum = 0, picked = 0;
    for (const c of p.bank) if (ids.has(c.instanceId)) { sum += c.bankValue; picked++; }
    for (const x of p.properties) if (!x.isMultiWild && ids.has(x.instanceId)) { sum += x.bankValue; picked++; }
    for (const b of builds) if (ids.has(b.card.instanceId)) { sum += b.card.bankValue; picked++; }
    const payableCount = p.bank.length + p.properties.filter(x => !x.isMultiWild).length + builds.length;

    if (wealth <= req.amount) {
      // Borcu karşılayamıyor → tüm ödenebilir kartlarını vermek zorunda
      if (picked < payableCount) return `Yetersiz varlık — tüm ödenebilir kartlarını (${wealth}M) vermelisin`;
    } else if (sum < req.amount) {
      // Borcu karşılayabiliyor → en az borç kadar ödemeli (para üstü verilmez)
      return `En az ${req.amount}M ödemelisin (seçtiğin: ${sum}M)`;
    }

    let gotProperty = false;
    for (const cid of cardIds) {
      const bi = p.bank.findIndex(x => x.instanceId === cid);
      if (bi >= 0) { cr.bank.push(...p.bank.splice(bi, 1)); continue; }
      const pi = p.properties.findIndex(x => x.instanceId === cid);
      if (pi >= 0) { const pr = p.properties.splice(pi,1)[0]; if (!pr.isMultiWild) { cr.properties.push(pr); gotProperty = true; } continue; }
      // Ev/Otel ile ödeme — kart rakibin bankasına gider (oyun.md: "bankasına gider")
      const bd = builds.find(b => b.card.instanceId === cid);
      if (bd) {
        const slot = p.buildings[bd.color]!;
        if (bd.isHotel) delete slot.hotel; else delete slot.house;
        if (!slot.house && !slot.hotel) delete p.buildings[bd.color];
        cr.bank.push(bd.card);
      }
    }
    this.log(`${p.name}, ${cr.name}'e ${req.amount}M borç için ${sum}M ödedi (${req.reason})`);
    this.finishPay(req);
    if (gotProperty) this.checkWin(cr); // ödeme olarak alınan tapu 3. seti tamamlayabilir
    return null;
  }

  // ─── TUR SONU ───

  endTurn(sid: string, discard: string[]): string | null {
    if (this.cur()?.id !== sid) return "Senin turun değil";
    if (this.activePay) return "Ödeme bekliyor";
    if (this.pendingSteal) return "Bekleyen işlem var";
    if (this.pendingPayChallenge) return "Reddet zinciri devam ediyor";
    if (this.pendingRent?.from === sid) this.flushRent();
    if (this.activePay) return null; // kira az önce kuyruğa girdi; ödemeler bitince tur bitirilir
    const p = this.p(sid)!;
    for (const cid of discard) { const c = this.rmHand(p, cid); if (c) this.drawPile.unshift(c); }
    while (p.hand.length > 7) { const c = p.hand.pop(); if (c) this.drawPile.unshift(c); }
    if (this.winnerName) return null;
    this.advanceTurn();
    return null;
  }

  // ─── YARDIMCILAR ───

  private canAct(sid: string) {
    return this.phase === "playing" && this.cur()?.id === sid && !this.activePay && !this.pendingSteal && !this.pendingPayChallenge && this.playsLeft > 0;
  }

  private rent(p: Player, col: PropertyColor) {
    const n = p.properties.filter(x => x.assignedColor === col).length;
    if (!n) return 0;
    let r = SETS[col].rent[Math.min(n, SETS[col].size) - 1];
    if (n >= SETS[col].size && BUILDABLE.includes(col)) {
      const b = p.buildings[col]; if (b?.house) r += 3; if (b?.hotel) r += 4;
    }
    return r;
  }

  private complete(p: Player, col: PropertyColor) {
    const props = p.properties.filter(x => x.assignedColor === col);
    return props.some(x => x.kind === "property") && props.length >= SETS[col].size;
  }

  private countSets(p: Player) {
    return (Object.keys(SETS) as PropertyColor[]).filter(c => this.complete(p, c)).length;
  }

  /**
   * Ödemede verilebilecek binalar. Fiziksel diziliş gereği yalnızca en üstteki
   * verilebilir: Otel varsa önce o, Otel yoksa Ev. (Evsiz Otel geçersiz bir durumdur.)
   */
  private payableBuildings(p: Player): { color: PropertyColor; card: CardInstance; isHotel: boolean }[] {
    const out: { color: PropertyColor; card: CardInstance; isHotel: boolean }[] = [];
    for (const [col, b] of Object.entries(p.buildings) as [PropertyColor, { house?: CardInstance; hotel?: CardInstance }][]) {
      if (b?.hotel) out.push({ color: col, card: b.hotel, isHotel: true });
      else if (b?.house) out.push({ color: col, card: b.house, isHotel: false });
    }
    return out;
  }

  private payable(p: Player) {
    return p.bank.reduce((s,c)=>s+c.bankValue,0)
      + p.properties.filter(x=>!x.isMultiWild).reduce((s,x)=>s+x.bankValue,0)
      + this.payableBuildings(p).reduce((s,b)=>s+b.card.bankValue,0);
  }

  private queuePay(from: string, to: string, amount: number, reason: string) {
    const debtor = this.p(from);
    if (!debtor) return;
    if (!debtor.connected) { this.log(`${debtor.name} çevrimdışı — ${amount}M borç atlandı`); return; }
    if (!this.payable(debtor)) { this.log(`${debtor.name} ödeyecek kartı yok — borç silindi`); return; }
    const id = `pay${payId++}`;
    this.payQueue.push({ id, fromPlayerId: from, toPlayerId: to, amount, reason });
    if (!this.activePay) this.activePay = id;
  }

  private finishPay(req: PaymentRequest) {
    this.payQueue = this.payQueue.filter(x => x.id !== req.id);
    this.activePay = this.payQueue[0]?.id ?? null;
  }

  private checkWin(p: Player) {
    if (this.phase !== "playing") return;
    if (this.countSets(p) >= 3) { this.winnerName = p.name; this.phase = "finished"; this.announce(`🏆 ${p.name} KAZANDI!`); }
  }

  // ─── GÖRÜNÜM ───

  view(sid?: string) {
    const me = sid ? this.p(sid) : undefined;
    const name = (id: string) => this.p(id)?.name ?? "?";
    return {
      phase: this.phase,
      players: this.players.map(p => ({
        id: p.id, name: p.name, handCount: p.hand.length,
        bank: p.bank, properties: p.properties,
        // İstemciye sadece var/yok bilgisi ve ödeme için kart kimlikleri gider
        buildings: Object.fromEntries(Object.entries(p.buildings).map(([col, b]) => [col, {
          house: !!b?.house, hotel: !!b?.hotel,
          houseId: b?.house?.instanceId, hotelId: b?.hotel?.instanceId,
        }])),
        connected: p.connected, completeSetCount: this.countSets(p),
      })),
      currentPlayerId: this.order[this.turnIdx] ?? null,
      turnPhase: this.pendingPayChallenge ? "pay_challenge" : this.activePay ? "awaiting_payments" : this.pendingSteal ? "awaiting_response" : "main",
      playsRemaining: this.playsLeft,
      drawPileCount: this.drawPile.length,
      winnerName: this.winnerName,
      activePayment: this.payQueue.find(x => x.id === this.activePay) ?? null,
      paymentQueue: this.payQueue.map(q => ({
        id: q.id, fromName: name(q.fromPlayerId), toName: name(q.toPlayerId), amount: q.amount, active: q.id === this.activePay,
      })),
      pendingSteal: this.pendingSteal ? {
        id: this.pendingSteal.id,
        type: this.pendingSteal.type,
        fromPlayerId: this.pendingSteal.fromPlayerId,
        fromPlayerName: name(this.pendingSteal.fromPlayerId),
        targetPlayerId: this.pendingSteal.targetPlayerId,
        targetPlayerName: name(this.pendingSteal.targetPlayerId),
        awaitingId: this.pendingSteal.awaitingId,
        noCount: this.pendingSteal.noCount,
        setColor: this.pendingSteal.setColor,
      } : null,
      pendingPayChallenge: this.pendingPayChallenge ? {
        paymentId: this.pendingPayChallenge.paymentId,
        noCount: this.pendingPayChallenge.noCount,
        awaitingId: this.pendingPayChallenge.awaitingId,
        debtorName: name(this.pendingPayChallenge.debtorId),
        creditorName: name(this.pendingPayChallenge.creditorId),
      } : null,
      announcement: this.announcement,
      logs: this.logs, chat: this.chat,
      myHand: me?.hand, myId: sid,
      allowedNames: this.allowedNames,
      minPlayers: this.minPlayers,
      maxPlayers: this.maxPlayers,
    };
  }
}
