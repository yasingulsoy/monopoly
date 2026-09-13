"use client";

import { useState } from "react";
import type {
  CardInstance, GameState, PlayActionParams, PropertyColor, PublicPlayer, PlacedProperty,
} from "@/lib/types";
import { ALL_COLORS, COLOR_HEX, COLOR_LABELS, SET_SIZES } from "@/lib/types";
import { Card } from "./Card";
import { Chat } from "./Chat";

interface Props {
  state: GameState;
  onBank: (id: string) => void;
  onProperty: (id: string, color?: PropertyColor) => void;
  onAction: (p: PlayActionParams) => void;
  onPay: (ids: string[]) => void;
  onEndTurn: (ids: string[]) => void;
  onChat: (t: string) => void;
  onJustSayNo: (cardId: string) => void;
  onAcceptSteal: () => void;
  onAcceptPayChallenge: () => void;
  onMoveWild: (propertyId: string, color: PropertyColor) => void;
  onReset: () => void;
}

type Modal =
  | { t: "none" }
  | { t: "color"; cardId: string; colors: PropertyColor[]; mode: "wild" | "rent" | "house" | "hotel" | "deal_breaker"; targetId?: string }
  | { t: "player"; cardId: string; action: string }
  | { t: "sly"; cardId: string; targetId: string }
  | { t: "swap"; cardId: string; targetId: string; step: "mine" | "theirs"; myProp?: string }
  | { t: "rent_any"; cardId: string; step: "player" | "color"; targetId?: string }
  | { t: "bankOrAction"; card: CardInstance }
  | { t: "moveWild"; propertyId: string; colors: PropertyColor[] };

export function GameBoard({ state, onBank, onProperty, onAction, onPay, onEndTurn, onChat, onJustSayNo, onAcceptSteal, onAcceptPayChallenge, onMoveWild, onReset }: Props) {
  const [modal, setModal] = useState<Modal>({ t: "none" });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [discardMode, setDiscardMode] = useState(false);
  const [discardSelected, setDiscardSelected] = useState<Set<string>>(new Set());

  const me = state.players.find((p) => p.id === state.myId);
  const hand = state.myHand ?? [];
  const isMyTurn = state.currentPlayerId === state.myId;
  const opponents = state.players.filter((p) => p.id !== state.myId);
  const paying = state.activePayment?.fromPlayerId === state.myId;
  const myJustSayNo = hand.find(c => c.kind === "just_say_no");
  const myCompleteSets = me ? ALL_COLORS.filter((c) => isComplete(me, c)) : [];
  // Ödemeler beklerken alacaklı da dahil kimse hamle yapamaz
  const canPlay = isMyTurn && !paying && !state.activePayment && !state.pendingSteal && !state.pendingPayChallenge && state.playsRemaining > 0;

  /** Aksiyon kartını oynama akışı — gerekirse hedef/renk seçtiren modal açar */
  const playAction = (card: CardInstance) => {
    if (card.kind === "rent_dual" && card.colors) {
      setModal({ t: "color", cardId: card.instanceId, colors: card.colors, mode: "rent" });
      return;
    }
    if (card.kind === "rent_any") { setModal({ t: "rent_any", cardId: card.instanceId, step: "player" }); return; }
    if (card.kind === "house") { setModal({ t: "color", cardId: card.instanceId, colors: myCompleteSets.filter(c => c !== "railroad" && c !== "utility"), mode: "house" }); return; }
    if (card.kind === "hotel") { setModal({ t: "color", cardId: card.instanceId, colors: myCompleteSets.filter(c => c !== "railroad" && c !== "utility"), mode: "hotel" }); return; }
    if (["debt_collector", "sly_deal", "forced_deal", "deal_breaker"].includes(card.kind)) {
      setModal({ t: "player", cardId: card.instanceId, action: card.kind });
      return;
    }
    onAction({ cardId: card.instanceId });
  };

  const clickCard = (card: CardInstance) => {
    if (discardMode) {
      setDiscardSelected(s => { const n = new Set(s); n.has(card.instanceId) ? n.delete(card.instanceId) : n.add(card.instanceId); return n; });
      return;
    }
    if (!canPlay) return;
    if (card.kind === "money") return onBank(card.instanceId);
    if (card.kind === "property") return onProperty(card.instanceId, card.color);
    if (card.kind === "wild_property") {
      setModal({ t: "color", cardId: card.instanceId, colors: card.isMultiWild ? ALL_COLORS : (card.colors ?? ALL_COLORS), mode: "wild" });
      return;
    }
    // Her aksiyon kartı para olarak da bankaya konabilir — oyuncu seçsin
    setModal({ t: "bankOrAction", card });
  };

  const handleEndTurn = () => {
    if (hand.length > 7 && !discardMode) {
      setDiscardMode(true);
      setDiscardSelected(new Set());
      return;
    }
    onEndTurn([...discardSelected]);
    setDiscardMode(false);
    setDiscardSelected(new Set());
  };

  const discardNeeded = Math.max(0, hand.length - 7);

  // Ödemede verilebilecekler: banka + mülkler (çok renkli joker hariç) + en üstteki bina
  const payable = me ? [
    ...me.bank.map(c => ({ id: c.instanceId, label: c.displayName, v: c.bankValue })),
    ...me.properties.filter(p => !p.isMultiWild).map(p => ({ id: p.instanceId, label: p.displayName, v: p.bankValue })),
    ...ALL_COLORS.flatMap(col => {
      const b = me.buildings[col];
      if (b?.hotel && b.hotelId) return [{ id: b.hotelId, label: `Otel · ${COLOR_LABELS[col]}`, v: 4 }];
      if (b?.house && b.houseId) return [{ id: b.houseId, label: `Ev · ${COLOR_LABELS[col]}`, v: 3 }];
      return [];
    }),
  ] : [];

  return (
    <div className="flex h-full min-h-0 gap-3">
      {/* Sol: Oyun masası */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-2">

        {state.announcement && (
          <div className="rounded-xl border border-amber-400/40 bg-gradient-to-r from-amber-500/10 to-orange-500/10 px-5 py-3 text-center font-semibold text-amber-200 shadow-lg">
            {state.announcement}
          </div>
        )}

        <StatusBar state={state} isMyTurn={isMyTurn} onReset={onReset} />

        {/* Pending Steal */}
        {state.pendingSteal && (
          <PendingStealPanel
            steal={state.pendingSteal}
            myId={state.myId}
            myJustSayNo={myJustSayNo}
            onJustSayNo={onJustSayNo}
            onAccept={onAcceptSteal}
          />
        )}

        {/* Ödeme için Reddet zinciri */}
        {state.pendingPayChallenge && (
          <PayChallengePanel
            challenge={state.pendingPayChallenge}
            myId={state.myId}
            myJustSayNo={myJustSayNo}
            onJustSayNo={onJustSayNo}
            onAccept={onAcceptPayChallenge}
          />
        )}

        {/* Sıradaki ödemeler — herkes görsün */}
        {state.paymentQueue.length > 0 && !state.pendingPayChallenge && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-950/30 px-4 py-2.5 text-sm">
            <span className="mr-2 font-bold text-amber-200">Bekleyen ödemeler:</span>
            {state.paymentQueue.map((q, i) => (
              <span key={q.id} className={`mr-3 ${q.active ? "font-semibold text-white" : "text-amber-200/70"}`}>
                {q.active ? "▶ " : `${i + 1}. `}{q.fromName} → {q.toName} {q.amount}M
              </span>
            ))}
          </div>
        )}

        {/* Rakipler */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {opponents.map(p => (
            <OpponentPanel key={p.id} player={p} active={p.id === state.currentPlayerId} />
          ))}
        </div>

        {/* Benim alanım */}
        {me && (
          <MyArea
            me={me}
            myCompleteSets={myCompleteSets}
            isMyTurn={isMyTurn}
            onMoveWild={(propId, colors) => setModal({ t: "moveWild", propertyId: propId, colors })}
          />
        )}

        {/* Ödeme paneli */}
        {paying && state.activePayment && !state.pendingPayChallenge && (
          <PaymentPanel
            payment={state.activePayment}
            players={state.players}
            payable={payable}
            selected={selected}
            setSelected={setSelected}
            onPay={onPay}
            myJustSayNo={myJustSayNo}
            onJustSayNo={onJustSayNo}
          />
        )}

        {/* Elim */}
        <div className="rounded-2xl border border-slate-700/50 bg-gradient-to-b from-slate-900/90 to-slate-800/90 p-4 shadow-inner">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-base font-bold text-white">Elim</span>
              <span className="rounded-full bg-slate-700 px-2.5 py-0.5 text-xs font-medium text-slate-300">{hand.length} kart</span>
              {discardMode && (
                <span className="rounded-full bg-red-500/20 border border-red-500/30 px-2.5 py-0.5 text-xs font-bold text-red-300 animate-pulse">
                  {discardSelected.size}/{discardNeeded} kart seçildi — at ve turu bitir
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {discardMode && (
                <button type="button" onClick={() => { setDiscardMode(false); setDiscardSelected(new Set()); }}
                  className="rounded-xl bg-slate-600 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-500 transition-colors">
                  İptal
                </button>
              )}
              {isMyTurn && !paying && !state.activePayment && !state.pendingSteal && !state.pendingPayChallenge && (
                <button type="button"
                  onClick={handleEndTurn}
                  disabled={discardMode && discardSelected.size < discardNeeded}
                  className="rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-40 transition-all">
                  {discardMode ? `${discardSelected.size} kart at ve bitir` : "Turu Bitir"}
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {hand.map(c => (
              <Card
                key={c.instanceId}
                card={c}
                selected={discardMode && discardSelected.has(c.instanceId)}
                onClick={(canPlay || discardMode) ? () => clickCard(c) : undefined}
                disabled={!canPlay && !discardMode}
              />
            ))}
            {hand.length === 0 && <p className="text-sm text-slate-500 italic">Elin boş</p>}
          </div>
        </div>

        {/* Log */}
        <div className="max-h-20 overflow-y-auto rounded-xl bg-black/30 p-3 text-xs text-slate-400 font-mono">
          {state.logs.slice(-8).map(l => <div key={l.id} className="py-0.5">{l.message}</div>)}
        </div>
      </div>

      {/* Sağ: Chat */}
      <div className="hidden w-72 shrink-0 lg:block">
        <Chat messages={state.chat} onSend={onChat} myName={me?.name} />
      </div>

      {/* ─── Modals ─── */}
      {modal.t === "color" && (
        <Overlay title={modal.mode === "wild" ? "Renk seç" : modal.mode === "rent" ? "Kira rengi seç" : modal.mode === "house" ? "Ev ekle" : modal.mode === "hotel" ? "Otel ekle" : "Set seç"} onClose={() => setModal({ t: "none" })}>
          <div className="grid grid-cols-2 gap-2">
            {modal.colors.map(c => (
              <button key={c} type="button" onClick={() => {
                if (modal.mode === "wild") onProperty(modal.cardId, c);
                else if (modal.mode === "rent") onAction({ cardId: modal.cardId, targetColor: c });
                else if (modal.mode === "house" || modal.mode === "hotel") onAction({ cardId: modal.cardId, setColor: c });
                else if (modal.mode === "deal_breaker") onAction({ cardId: modal.cardId, targetPlayerId: modal.targetId, targetColor: c });
                setModal({ t: "none" });
              }}
                className="flex items-center gap-2 rounded-xl px-4 py-3 font-medium text-white transition-all hover:scale-105 hover:shadow-lg"
                style={{ background: COLOR_HEX[c] }}>
                {COLOR_LABELS[c]}
              </button>
            ))}
          </div>
          {modal.colors.length === 0 && <p className="text-sm text-slate-400">Uygun tam set yok</p>}
        </Overlay>
      )}
      {modal.t === "player" && (
        <Overlay title="Rakip seç" onClose={() => setModal({ t: "none" })}>
          <div className="grid gap-2">
            {opponents.map(p => (
              <button key={p.id} type="button" onClick={() => {
                if (modal.action === "sly_deal") setModal({ t: "sly", cardId: modal.cardId, targetId: p.id });
                else if (modal.action === "forced_deal") setModal({ t: "swap", cardId: modal.cardId, targetId: p.id, step: "mine" });
                else if (modal.action === "deal_breaker") {
                  const completeSets = ALL_COLORS.filter(c => isComplete(p, c));
                  setModal({ t: "color", cardId: modal.cardId, colors: completeSets, mode: "deal_breaker", targetId: p.id });
                }
                else { onAction({ cardId: modal.cardId, targetPlayerId: p.id }); setModal({ t: "none" }); }
              }}
                disabled={!p.connected}
                className="flex items-center justify-between rounded-xl bg-slate-700/80 px-4 py-3 text-left hover:bg-slate-600 transition-colors disabled:cursor-not-allowed disabled:opacity-40">
                <span className="font-medium">
                  {p.name}
                  {!p.connected && <span className="ml-2 text-[10px] font-bold text-slate-400">ÇEVRİMDIŞI</span>}
                </span>
                <span className="text-xs text-slate-400">{p.properties.length} mülk · {p.completeSetCount} set</span>
              </button>
            ))}
          </div>
        </Overlay>
      )}
      {modal.t === "sly" && (
        <Overlay title="El koyacağın mülkü seç" onClose={() => setModal({ t: "none" })}>
          <PropBtns player={state.players.find(p => p.id === modal.targetId)!} onlyIncomplete
            onPick={id => { onAction({ cardId: modal.cardId, targetPlayerId: modal.targetId, theirPropertyId: id }); setModal({ t: "none" }); }} />
        </Overlay>
      )}
      {modal.t === "swap" && (
        <Overlay title={modal.step === "mine" ? "Senin vereceğin mülk" : "Rakipten alacağın mülk"} onClose={() => setModal({ t: "none" })}>
          {modal.step === "mine" ? (
            <PropBtns player={me!} onPick={id => setModal({ ...modal, step: "theirs", myProp: id })} />
          ) : (
            <PropBtns player={state.players.find(p => p.id === modal.targetId)!} onlyIncomplete
              onPick={id => { onAction({ cardId: modal.cardId, targetPlayerId: modal.targetId, myPropertyId: modal.myProp, theirPropertyId: id }); setModal({ t: "none" }); }} />
          )}
        </Overlay>
      )}
      {modal.t === "rent_any" && (
        <Overlay title={modal.step === "player" ? "Kimden kira alacaksın?" : "Hangi set için?"} onClose={() => setModal({ t: "none" })}>
          {modal.step === "player" ? (
            <div className="grid gap-2">
              {opponents.map(p => (
                <button key={p.id} type="button" disabled={!p.connected} onClick={() => setModal({ ...modal, step: "color", targetId: p.id })}
                  className="rounded-xl bg-slate-700/80 px-4 py-3 text-left hover:bg-slate-600 transition-colors font-medium disabled:cursor-not-allowed disabled:opacity-40">
                  {p.name}{!p.connected && <span className="ml-2 text-[10px] text-slate-400">ÇEVRİMDIŞI</span>}
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {ALL_COLORS.map(c => (
                <button key={c} type="button" onClick={() => {
                  onAction({ cardId: modal.cardId, targetPlayerId: modal.targetId, targetColor: c });
                  setModal({ t: "none" });
                }} className="rounded-xl px-3 py-2 text-sm font-medium text-white hover:scale-105 transition-all" style={{ background: COLOR_HEX[c] }}>
                  {COLOR_LABELS[c]}
                </button>
              ))}
            </div>
          )}
        </Overlay>
      )}
      {modal.t === "bankOrAction" && (
        <Overlay title={modal.card.displayName} onClose={() => setModal({ t: "none" })}>
          <div className="grid gap-2">
            {modal.card.kind !== "just_say_no" ? (
              <button type="button" onClick={() => { const c = modal.card; setModal({ t: "none" }); playAction(c); }}
                className="rounded-xl bg-blue-600 px-4 py-3 font-bold hover:bg-blue-500 transition-colors">
                Oyna
              </button>
            ) : (
              <p className="rounded-xl bg-slate-700/60 px-4 py-3 text-sm text-slate-300">
                Reddet, sana karşı bir hamle yapıldığında otomatik teklif edilir. Şimdi yalnızca bankaya koyabilirsin.
              </p>
            )}
            <button type="button" onClick={() => { onBank(modal.card.instanceId); setModal({ t: "none" }); }}
              className="rounded-xl bg-emerald-700 px-4 py-3 font-medium hover:bg-emerald-600 transition-colors">
              Bankaya koy ({modal.card.bankValue}M)
            </button>
          </div>
        </Overlay>
      )}
      {modal.t === "moveWild" && (
        <Overlay title="Jokeri hangi sete taşı?" onClose={() => setModal({ t: "none" })}>
          <div className="grid grid-cols-2 gap-2">
            {modal.colors.map(c => (
              <button key={c} type="button" onClick={() => { onMoveWild(modal.propertyId, c); setModal({ t: "none" }); }}
                className="flex items-center gap-2 rounded-xl px-4 py-3 font-medium text-white hover:scale-105 transition-all"
                style={{ background: COLOR_HEX[c] }}>
                {COLOR_LABELS[c]}
              </button>
            ))}
          </div>
        </Overlay>
      )}
    </div>
  );
}

// ─── STATUS BAR ───

function StatusBar({ state, isMyTurn, onReset }: { state: GameState; isMyTurn: boolean; onReset: () => void }) {
  const currentPlayer = state.players.find(p => p.id === state.currentPlayerId);
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-800/70 px-5 py-3 shadow-md border border-slate-700/50">
      {state.phase === "finished" ? (
        <>
          <span className="text-lg font-black text-yellow-300">🏆 {state.winnerName} KAZANDI!</span>
          <button type="button" onClick={onReset}
            className="ml-auto rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-5 py-2 text-sm font-bold text-white shadow-lg hover:from-emerald-500 hover:to-emerald-400 transition-all">
            🔄 Yeni Oyun
          </button>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${isMyTurn ? "bg-green-400 animate-pulse" : "bg-amber-400"}`} />
            <span className="font-bold text-white">
              {isMyTurn ? "SENİN TURUN" : `${currentPlayer?.name ?? "?"} oynuyor`}
            </span>
          </div>
          {isMyTurn && state.playsRemaining > 0 && (
            <span className="rounded-full bg-amber-500/20 border border-amber-500/30 px-3 py-1 text-sm font-semibold text-amber-300">
              {state.playsRemaining} hamle hakkı
            </span>
          )}
          {isMyTurn && state.playsRemaining === 0 && (
            <span className="rounded-full bg-red-500/20 border border-red-500/30 px-3 py-1 text-sm font-semibold text-red-300 animate-pulse">
              Hamle hakkın bitti — Turu Bitir!
            </span>
          )}
          {state.activePayment && (
            <span className="rounded-full bg-orange-500/20 border border-orange-500/30 px-3 py-1 text-sm font-semibold text-orange-300">
              Ödemeler bekleniyor
            </span>
          )}
          <span className="ml-auto text-sm text-slate-400">Deste: {state.drawPileCount}</span>
        </>
      )}
    </div>
  );
}

// ─── OPPONENT PANEL (FIX 6: detailed opponent view) ───

function OpponentPanel({ player, active }: { player: PublicPlayer; active: boolean }) {
  const grouped = groupProps(player.properties);
  const bankTotal = player.bank.reduce((s, c) => s + c.bankValue, 0);

  return (
    <div className={`rounded-2xl border p-4 transition-all ${active ? "border-amber-400/60 bg-amber-950/20 shadow-lg shadow-amber-500/10" : "border-slate-700/40 bg-slate-800/50"} ${!player.connected ? "opacity-60" : ""}`}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {active && <div className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse" />}
          <span className="font-bold text-white text-base">{player.name}</span>
          {!player.connected && (
            <span className="rounded bg-slate-600 px-1.5 py-0.5 text-[9px] font-bold text-slate-400">OFFLINE</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="rounded bg-slate-700 px-1.5 py-0.5">{player.handCount} kart</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${player.completeSetCount >= 3 ? "bg-yellow-500 text-black animate-pulse" : "bg-slate-700 text-slate-300"}`}>
            {player.completeSetCount}/3
          </span>
        </div>
      </div>

      {grouped.length > 0 ? (
        <div className="space-y-2">
          {grouped.map(([color, props]) => {
            const complete = props.length >= SET_SIZES[color] && props.some(x => x.kind === "property");
            return (
              <PropertySet key={color} color={color} props={props} buildings={player.buildings[color]} size="small" complete={complete} />
            );
          })}
        </div>
      ) : (
        <p className="text-xs italic text-slate-500">Henüz mülk yok</p>
      )}

      {player.bank.length > 0 && (
        <div className="mt-3 border-t border-slate-700/30 pt-2">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-medium text-slate-500">BANKA</span>
            <span className="text-xs font-bold text-emerald-400">{bankTotal}M</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {player.bank.map(c => <Card key={c.instanceId} card={c} small />)}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MY AREA (FIX 4: wild move button) ───

function MyArea({ me, myCompleteSets, isMyTurn, onMoveWild }: {
  me: PublicPlayer; myCompleteSets: PropertyColor[];
  isMyTurn: boolean;
  onMoveWild: (propId: string, colors: PropertyColor[]) => void;
}) {
  const grouped = groupProps(me.properties);
  const bankTotal = me.bank.reduce((s, c) => s + c.bankValue, 0);

  return (
    <div className="rounded-2xl border-2 border-blue-500/30 bg-gradient-to-b from-slate-800/60 to-slate-900/60 p-5 shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg font-black text-white">{me.name}</span>
          <span className="rounded-full bg-blue-500/20 border border-blue-500/30 px-2.5 py-0.5 text-xs font-bold text-blue-300">SEN</span>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${me.completeSetCount >= 3 ? "bg-yellow-500 text-black animate-pulse" : "bg-slate-700 text-slate-300"}`}>
            {me.completeSetCount}/3 set
          </span>
        </div>
        <div className="text-right">
          <span className="text-lg font-bold text-emerald-400">{bankTotal}M</span>
          <span className="ml-1 text-xs text-slate-400">banka</span>
        </div>
      </div>

      {grouped.length > 0 && (
        <div className="mb-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {grouped.map(([color, props]) => (
            <PropertySet
              key={color}
              color={color}
              props={props}
              buildings={me.buildings[color]}
              complete={myCompleteSets.includes(color)}
              isMyTurn={isMyTurn}
              onMoveWild={onMoveWild}
            />
          ))}
        </div>
      )}

      {me.bank.length > 0 && (
        <div className="mt-3 border-t border-slate-700/50 pt-3">
          <p className="mb-2 text-xs font-medium text-slate-400">Banka</p>
          <div className="flex flex-wrap gap-1.5">
            {me.bank.map(c => <Card key={c.instanceId} card={c} small />)}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PROPERTY SET (FIX 4: wild move button, FIX 6: complete badge) ───

function PropertySet({ color, props, buildings, complete, size, isMyTurn, onMoveWild }: {
  color: PropertyColor; props: PlacedProperty[];
  buildings?: { house: boolean; hotel: boolean };
  complete?: boolean; size?: "small";
  isMyTurn?: boolean;
  onMoveWild?: (propId: string, colors: PropertyColor[]) => void;
}) {
  const needed = SET_SIZES[color];
  const isSmall = size === "small";

  return (
    <div className={`rounded-xl border p-2 transition-all ${complete ? "border-yellow-400/50 bg-yellow-500/5 shadow-sm shadow-yellow-500/10" : "border-slate-700/30 bg-slate-900/30"}`}>
      <div className="mb-1.5 flex items-center gap-2">
        <div className="h-3 w-8 rounded-sm" style={{ background: COLOR_HEX[color] }} />
        <span className={`font-semibold text-slate-300 ${isSmall ? "text-[10px]" : "text-xs"}`}>
          {COLOR_LABELS[color]}
        </span>
        <span className={`ml-auto text-slate-500 ${isSmall ? "text-[9px]" : "text-[10px]"}`}>
          {props.length}/{needed}
        </span>
        {complete && <span className="rounded bg-yellow-500/30 border border-yellow-500/40 px-1 text-[8px] font-black text-yellow-300">TAM</span>}
        {buildings?.house && <span className="text-xs" title="Ev">🏠</span>}
        {buildings?.hotel && <span className="text-xs" title="Otel">🏨</span>}
      </div>
      <div className="flex flex-wrap gap-1">
        {props.map(p => (
          <div key={p.instanceId} className="relative">
            <Card card={p} small />
            {/* FIX 4: Move wild button */}
            {isMyTurn && onMoveWild && p.kind === "wild_property" && (
              <button
                type="button"
                onClick={() => {
                  const available = p.isMultiWild ? ALL_COLORS.filter(c => c !== p.assignedColor) : (p.colors ?? []).filter(c => c !== p.assignedColor);
                  onMoveWild(p.instanceId, available);
                }}
                className="absolute -top-1 -right-1 z-10 h-5 w-5 rounded-full bg-blue-600 text-[9px] font-bold text-white shadow-md hover:bg-blue-500 transition-colors flex items-center justify-center"
                title="Jokeri başka sete taşı"
              >
                ↔
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── FIX 1: PendingStealPanel — uses fromPlayerId/targetPlayerId ───

function PendingStealPanel({ steal, myId, myJustSayNo, onJustSayNo, onAccept }: {
  steal: NonNullable<GameState["pendingSteal"]>;
  myId?: string;
  myJustSayNo?: CardInstance;
  onJustSayNo: (cardId: string) => void;
  onAccept: () => void;
}) {
  const typeLabels = { sly_deal: "Tapu Devri", forced_deal: "Değiş Tokuş", deal_breaker: "HACİZ" };
  const cancelled = steal.noCount % 2 === 1;
  const iMustRespond = steal.awaitingId === myId;

  return (
    <div className="rounded-2xl border-2 border-red-500/50 bg-gradient-to-r from-red-950/60 to-orange-950/40 p-5 shadow-xl">
      <div className="mb-2 text-lg font-black text-red-200">
        {typeLabels[steal.type]}!
      </div>
      <p className="text-sm text-red-100">
        <strong>{steal.fromPlayerName}</strong> → <strong>{steal.targetPlayerName}</strong>
        {steal.setColor && ` (${COLOR_LABELS[steal.setColor]} seti)`}
      </p>
      {steal.noCount > 0 && (
        <p className="mt-1 text-sm text-amber-300">
          {steal.noCount}x Reddet oynandı — {cancelled ? "İşlem şu an iptal" : "İşlem geçerli"}
        </p>
      )}

      {iMustRespond && (
        <div className="mt-4 flex gap-3">
          {myJustSayNo && (
            <button type="button" onClick={() => onJustSayNo(myJustSayNo.instanceId)}
              className="rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-5 py-2.5 font-bold text-white shadow-lg hover:from-red-500 hover:to-rose-500 transition-all">
              🚫 REDDET!
            </button>
          )}
          <button type="button" onClick={onAccept}
            className="rounded-xl bg-slate-600 px-5 py-2.5 font-medium text-slate-200 hover:bg-slate-500 transition-colors">
            {cancelled ? "Tamam (iptal edildi)" : "Kabul Et"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── PayChallengePanel — ödeme için Reddet zinciri ───

function PayChallengePanel({ challenge, myId, myJustSayNo, onJustSayNo, onAccept }: {
  challenge: NonNullable<GameState["pendingPayChallenge"]>;
  myId?: string;
  myJustSayNo?: CardInstance;
  onJustSayNo: (cardId: string) => void;
  onAccept: () => void;
}) {
  const cancelled = challenge.noCount % 2 === 1;
  const iMustRespond = challenge.awaitingId === myId;

  return (
    <div className="rounded-2xl border-2 border-orange-500/50 bg-gradient-to-r from-orange-950/60 to-red-950/40 p-5 shadow-xl">
      <div className="mb-2 text-lg font-black text-orange-200">
        🚫 Reddet Zinciri!
      </div>
      <p className="text-sm text-orange-100">
        <strong>{challenge.debtorName}</strong> ödemeyi reddetti! <strong>{challenge.creditorName}</strong> karşılık verebilir.
      </p>
      <p className="mt-1 text-sm text-amber-300">
        {challenge.noCount}x Reddet oynandı — {cancelled ? "Ödeme şu an iptal" : "Ödeme geçerli"}
      </p>

      {iMustRespond && (
        <div className="mt-4 flex gap-3">
          {myJustSayNo && (
            <button type="button" onClick={() => onJustSayNo(myJustSayNo.instanceId)}
              className="rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-5 py-2.5 font-bold text-white shadow-lg hover:from-red-500 hover:to-rose-500 transition-all">
              🚫 REDDET! (Karşılık)
            </button>
          )}
          <button type="button" onClick={onAccept}
            className="rounded-xl bg-slate-600 px-5 py-2.5 font-medium text-slate-200 hover:bg-slate-500 transition-colors">
            {cancelled ? "Tamam (ödeme iptal)" : "Geçir (ödeme devam)"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── PAYMENT PANEL ───

function PaymentPanel({ payment, players, payable, selected, setSelected, onPay, myJustSayNo, onJustSayNo }: {
  payment: NonNullable<GameState["activePayment"]>;
  players: PublicPlayer[];
  payable: { id: string; label: string; v: number }[];
  selected: Set<string>;
  setSelected: (fn: (s: Set<string>) => Set<string>) => void;
  onPay: (ids: string[]) => void;
  myJustSayNo?: CardInstance;
  onJustSayNo: (cardId: string) => void;
}) {
  const creditor = players.find(p => p.id === payment.toPlayerId);
  const total = [...selected].reduce((s, id) => s + (payable.find(x => x.id === id)?.v ?? 0), 0);
  const wealth = payable.reduce((s, c) => s + c.v, 0);
  const givingEverything = payable.length > 0 && selected.size === payable.length;
  // Borcu karşılayabiliyorsa en az borç kadar; karşılayamıyorsa her şeyini vermeli
  const sufficient = total >= payment.amount || (wealth <= payment.amount && givingEverything);

  return (
    <div className="rounded-2xl border-2 border-red-500/50 bg-gradient-to-b from-red-950/50 to-slate-900/80 p-5 shadow-xl">
      <div className="mb-1 text-lg font-black text-red-200">ÖDEME!</div>
      <p className="text-sm text-red-100">
        <strong>{creditor?.name}</strong> senden <span className="text-2xl font-black text-white">{payment.amount}M</span> istiyor
      </p>
      <p className="mb-3 text-xs text-red-300">{payment.reason}</p>

      {myJustSayNo && (
        <button type="button" onClick={() => onJustSayNo(myJustSayNo.instanceId)}
          className="mb-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-5 py-2 font-bold text-white shadow-lg hover:from-red-500 hover:to-rose-500 transition-all">
          🚫 REDDET! (Ödemeyi iptal et)
        </button>
      )}

      <p className="mb-2 text-xs text-slate-400">
        Ödeyecek kartlarını seç (para üstü verilmez):
        {payable.length > 0 && (
          <span className={`ml-1 font-semibold ${sufficient ? "text-emerald-400" : "text-amber-400"}`}>
            seçilen {total}M / gereken {payment.amount}M
            {wealth <= payment.amount && " — tüm varlığını vermelisin"}
          </span>
        )}
      </p>
      <div className="flex flex-wrap gap-2">
        {payable.map(c => (
          <button key={c.id} type="button"
            onClick={() => setSelected(s => { const n = new Set(s); n.has(c.id) ? n.delete(c.id) : n.add(c.id); return n; })}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${selected.has(c.id) ? "bg-red-600 text-white scale-105 shadow-md" : "bg-slate-700 text-slate-300 hover:bg-slate-600"}`}>
            {c.label} ({c.v}M)
          </button>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button type="button" disabled={!sufficient}
          onClick={() => { onPay([...selected]); setSelected(() => new Set()); }}
          className="rounded-xl bg-red-600 px-5 py-2 font-bold text-white hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          Öde {total > 0 ? `(${total}M)` : ""}
        </button>
        {payable.length === 0 && (
          <button type="button" onClick={() => onPay([])}
            className="rounded-xl bg-slate-600 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-500">
            Ödeyecek kartım yok
          </button>
        )}
      </div>
    </div>
  );
}

// ─── HELPERS ───

function Overlay({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-slate-600/50 bg-slate-800 p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-lg bg-slate-700 p-1.5 text-slate-400 hover:bg-slate-600 hover:text-white transition-colors">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function PropBtns({ player, onPick, onlyIncomplete }: { player: PublicPlayer; onPick: (id: string) => void; onlyIncomplete?: boolean }) {
  const list = onlyIncomplete
    ? player.properties.filter(p => !isComplete(player, p.assignedColor))
    : player.properties;
  const grouped = groupProps(list);

  return (
    <div className="space-y-2">
      {grouped.map(([color, props]) => (
        <div key={color}>
          <div className="mb-1 flex items-center gap-2">
            <div className="h-2 w-6 rounded-sm" style={{ background: COLOR_HEX[color] }} />
            <span className="text-xs text-slate-400">{COLOR_LABELS[color]}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {props.map(p => (
              <button key={p.instanceId} type="button" onClick={() => onPick(p.instanceId)}
                className="rounded-lg border border-slate-600 bg-slate-700/80 px-3 py-2 text-sm font-medium text-white hover:bg-slate-600 hover:border-slate-500 transition-colors">
                {p.displayName}
              </button>
            ))}
          </div>
        </div>
      ))}
      {list.length === 0 && <p className="text-sm italic text-slate-400">Uygun mülk yok</p>}
    </div>
  );
}

function isComplete(p: PublicPlayer, color: PropertyColor) {
  const props = p.properties.filter(x => x.assignedColor === color);
  return props.some(x => x.kind === "property") && props.length >= SET_SIZES[color];
}

function groupProps(props: PlacedProperty[]) {
  const m = new Map<PropertyColor, PlacedProperty[]>();
  for (const p of props) { if (!m.has(p.assignedColor)) m.set(p.assignedColor, []); m.get(p.assignedColor)!.push(p); }
  return [...m.entries()];
}
