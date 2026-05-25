"use client";

import { useState } from "react";
import type {
  CardInstance, GameState, PlayActionParams, PropertyColor, PublicPlayer,
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
}

type Modal =
  | { t: "none" }
  | { t: "color"; cardId: string; colors: PropertyColor[]; mode: "wild" | "rent" | "house" | "hotel" | "deal_breaker"; targetId?: string }
  | { t: "player"; cardId: string; action: string }
  | { t: "sly"; cardId: string; targetId: string }
  | { t: "swap"; cardId: string; targetId: string; step: "mine" | "theirs"; myProp?: string }
  | { t: "rent_any"; cardId: string; step: "player" | "color"; targetId?: string };

export function GameBoard({ state, onBank, onProperty, onAction, onPay, onEndTurn, onChat }: Props) {
  const [modal, setModal] = useState<Modal>({ t: "none" });
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const me = state.players.find((p) => p.id === state.myId);
  const hand = state.myHand ?? [];
  const isMyTurn = state.currentPlayerId === state.myId;
  const opponents = state.players.filter((p) => p.id !== state.myId);
  const paying = state.activePayment?.fromPlayerId === state.myId;

  const myCompleteSets = ALL_COLORS.filter((c) => isComplete(me!, c));

  const clickCard = (card: CardInstance) => {
    if (!isMyTurn || paying) return;
    if (card.kind === "money") return onBank(card.instanceId);
    if (card.kind === "property") return onProperty(card.instanceId, card.color);
    if (card.kind === "wild_property") {
      setModal({ t: "color", cardId: card.instanceId, colors: card.isMultiWild ? ALL_COLORS : (card.colors ?? ALL_COLORS), mode: "wild" });
      return;
    }
    if (card.kind === "rent_dual" && card.colors) {
      setModal({ t: "color", cardId: card.instanceId, colors: card.colors, mode: "rent" });
      return;
    }
    if (card.kind === "rent_any") { setModal({ t: "rent_any", cardId: card.instanceId, step: "player" }); return; }
    if (card.kind === "house") { setModal({ t: "color", cardId: card.instanceId, colors: myCompleteSets.filter(c => c !== "railroad" && c !== "utility"), mode: "house" }); return; }
    if (card.kind === "hotel") { setModal({ t: "color", cardId: card.instanceId, colors: myCompleteSets.filter(c => c !== "railroad" && c !== "utility"), mode: "hotel" }); return; }
    if (card.kind === "birthday" || card.kind === "pass_go" || card.kind === "double_rent" || card.kind === "just_say_no") {
      return onAction({ cardId: card.instanceId });
    }
    if (["debt_collector", "sly_deal", "forced_deal", "deal_breaker"].includes(card.kind)) {
      setModal({ t: "player", cardId: card.instanceId, action: card.kind });
      return;
    }
    onBank(card.instanceId);
  };

  const payable = me ? [
    ...me.bank.map(c => ({ id: c.instanceId, label: c.displayName, v: c.bankValue })),
    ...me.properties.filter(p => !p.isMultiWild).map(p => ({ id: p.instanceId, label: p.displayName, v: p.bankValue })),
  ] : [];

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 lg:flex-row">
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
        {/* Duyuru bandı */}
        {state.announcement && (
          <div className="animate-pulse rounded-xl border border-amber-400/50 bg-amber-500/15 px-4 py-3 text-center font-medium text-amber-100">
            {state.announcement}
          </div>
        )}

        {/* Status */}
        <div className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-800/60 px-4 py-2 text-sm">
          <span className="font-bold">
            {state.phase === "finished" ? `🏆 ${state.winnerName} kazandı!` :
              `Sıra: ${state.players.find(p => p.id === state.currentPlayerId)?.name}`}
          </span>
          {isMyTurn && <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-amber-300">{state.playsRemaining} oyun hakkı</span>}
          <span className="text-slate-400">Deste: {state.drawPileCount}</span>
        </div>

        {/* Opponents */}
        <div className="grid gap-2 sm:grid-cols-2">
          {opponents.map(p => <PlayerPanel key={p.id} player={p} active={p.id === state.currentPlayerId} />)}
        </div>

        {/* Me */}
        {me && (
          <div className="rounded-xl border border-blue-500/30 bg-slate-800/40 p-4">
            <div className="mb-2 flex justify-between font-bold">
              <span>{me.name} (Sen) · {me.completeSetCount}/3 set</span>
              <span className="text-sm text-slate-400">Banka: {me.bank.reduce((s,c)=>s+c.bankValue,0)}M</span>
            </div>
            {me.properties.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {groupProps(me.properties).map(([color, props]) => (
                  <div key={color} className="rounded-lg border border-white/10 p-2">
                    <div className="mb-1 h-1 rounded" style={{ background: COLOR_HEX[color as PropertyColor] }} />
                    <p className="mb-1 text-xs">{COLOR_LABELS[color as PropertyColor]}</p>
                    <div className="flex gap-1">{props.map(p => <Card key={p.instanceId} card={p} small />)}</div>
                    {me.buildings[color as PropertyColor]?.house && <span className="text-xs">🏠</span>}
                    {me.buildings[color as PropertyColor]?.hotel && <span className="text-xs">🏨</span>}
                  </div>
                ))}
              </div>
            )}
            {me.bank.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {me.bank.map(c => <Card key={c.instanceId} card={c} small />)}
              </div>
            )}
          </div>
        )}

        {/* Payment */}
        {paying && state.activePayment && (
          <div className="rounded-xl border border-red-500/50 bg-red-950/40 p-4">
            <p className="text-lg font-bold text-red-200">
              {state.players.find(p => p.id === state.activePayment!.toPlayerId)?.name} senden{" "}
              <span className="text-2xl text-white">{state.activePayment.amount}M</span> istiyor!
            </p>
            <p className="mt-1 text-sm text-red-300">{state.activePayment.reason}</p>
            <p className="mb-2 text-xs text-red-400">Ödeyecek kartlarını seç (para üstü verilmez)</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {payable.map(c => (
                <button key={c.id} type="button" onClick={() => setSelected(s => { const n = new Set(s); n.has(c.id) ? n.delete(c.id) : n.add(c.id); return n; })}
                  className={`rounded px-2 py-1 text-sm ${selected.has(c.id) ? "bg-red-600" : "bg-slate-700"}`}>
                  {c.label} ({c.v}M)
                </button>
              ))}
            </div>
            <button type="button" onClick={() => { onPay([...selected]); setSelected(new Set()); }}
              className="mt-2 rounded-lg bg-red-600 px-4 py-1.5 text-sm">Öde</button>
            {payable.length === 0 && (
              <button type="button" onClick={() => onPay([])} className="ml-2 mt-2 rounded-lg bg-slate-600 px-4 py-1.5 text-sm">Ödeyecek kart yok</button>
            )}
          </div>
        )}

        {/* Hand */}
        <div className="rounded-xl bg-slate-900/80 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-semibold">El ({hand.length})</span>
            {isMyTurn && !paying && (
              <button type="button" onClick={() => onEndTurn([])} className="rounded-lg bg-emerald-600 px-4 py-1 text-sm font-medium hover:bg-emerald-500">
                Turu Bitir
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {hand.map(c => <Card key={c.instanceId} card={c} onClick={isMyTurn && !paying ? () => clickCard(c) : undefined} />)}
          </div>
        </div>

        {/* Log */}
        <div className="max-h-24 overflow-y-auto rounded-lg bg-black/20 p-2 text-xs text-slate-400">
          {state.logs.slice(-6).map(l => <div key={l.id}>{l.message}</div>)}
        </div>
      </div>

      <div className="h-72 shrink-0 lg:h-auto lg:w-72">
        <Chat messages={state.chat} onSend={onChat} myName={me?.name} />
      </div>

      {/* Modals */}
      {modal.t === "color" && (
        <Overlay title="Renk seç" onClose={() => setModal({ t: "none" })}>
          <ColorBtns colors={modal.colors} onPick={c => {
            if (modal.mode === "wild") onProperty(modal.cardId, c);
            else if (modal.mode === "rent") onAction({ cardId: modal.cardId, targetColor: c });
            else if (modal.mode === "house" || modal.mode === "hotel") onAction({ cardId: modal.cardId, setColor: c });
            else if (modal.mode === "deal_breaker") onAction({ cardId: modal.cardId, targetPlayerId: modal.targetId, targetColor: c });
            setModal({ t: "none" });
          }} />
        </Overlay>
      )}
      {modal.t === "player" && (
        <Overlay title="Rakip seç" onClose={() => setModal({ t: "none" })}>
          {opponents.map(p => (
            <button key={p.id} type="button" onClick={() => {
              if (modal.action === "sly_deal") setModal({ t: "sly", cardId: modal.cardId, targetId: p.id });
              else if (modal.action === "forced_deal") setModal({ t: "swap", cardId: modal.cardId, targetId: p.id, step: "mine" });
              else if (modal.action === "deal_breaker") setModal({ t: "color", cardId: modal.cardId, colors: ALL_COLORS, mode: "deal_breaker", targetId: p.id });
              else onAction({ cardId: modal.cardId, targetPlayerId: p.id });
              if (!["sly_deal","forced_deal","deal_breaker"].includes(modal.action)) setModal({ t: "none" });
            }} className="m-1 rounded-lg bg-slate-700 px-4 py-2 hover:bg-slate-600">{p.name}</button>
          ))}
        </Overlay>
      )}
      {modal.t === "sly" && (
        <Overlay title="Çalınacak mülk" onClose={() => setModal({ t: "none" })}>
          <PropBtns player={state.players.find(p => p.id === modal.targetId)!} complete={false}
            onPick={id => { onAction({ cardId: modal.cardId, targetPlayerId: modal.targetId, theirPropertyId: id }); setModal({ t: "none" }); }} />
        </Overlay>
      )}
      {modal.t === "swap" && (
        <Overlay title="Zorunlu Takas" onClose={() => setModal({ t: "none" })}>
          {modal.step === "mine" ? (
            <PropBtns player={me!} onPick={id => setModal({ ...modal, step: "theirs", myProp: id })} />
          ) : (
            <PropBtns player={state.players.find(p => p.id === modal.targetId)!}
              onPick={id => { onAction({ cardId: modal.cardId, targetPlayerId: modal.targetId, myPropertyId: modal.myProp, theirPropertyId: id }); setModal({ t: "none" }); }} />
          )}
        </Overlay>
      )}
      {modal.t === "rent_any" && (
        <Overlay title="Serbest Kira" onClose={() => setModal({ t: "none" })}>
          {modal.step === "player" ? opponents.map(p => (
            <button key={p.id} type="button" onClick={() => setModal({ ...modal, step: "color", targetId: p.id })}
              className="m-1 rounded-lg bg-slate-700 px-4 py-2">{p.name}</button>
          )) : (
            <ColorBtns colors={ALL_COLORS} onPick={c => {
              onAction({ cardId: modal.cardId, targetPlayerId: modal.targetId, targetColor: c });
              setModal({ t: "none" });
            }} />
          )}
        </Overlay>
      )}
    </div>
  );
}

function PlayerPanel({ player, active }: { player: PublicPlayer; active: boolean }) {
  return (
    <div className={`rounded-lg bg-slate-800/50 p-3 text-sm ${active ? "ring-2 ring-amber-400" : ""}`}>
      <div className="flex justify-between font-semibold">
        <span>{player.name}</span>
        <span className="text-slate-400">{player.handCount} kart · {player.completeSetCount}/3</span>
      </div>
    </div>
  );
}

function isComplete(p: PublicPlayer, color: PropertyColor) {
  const props = p.properties.filter(x => x.assignedColor === color);
  return props.some(x => x.kind === "property") && props.length >= SET_SIZES[color];
}

function groupProps(props: PublicPlayer["properties"]) {
  const m = new Map<PropertyColor, typeof props>();
  for (const p of props) { if (!m.has(p.assignedColor)) m.set(p.assignedColor, []); m.get(p.assignedColor)!.push(p); }
  return [...m.entries()];
}

function Overlay({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-slate-800 p-6 shadow-2xl">
        <div className="mb-4 flex justify-between"><h3 className="font-bold">{title}</h3><button type="button" onClick={onClose}>✕</button></div>
        {children}
      </div>
    </div>
  );
}

function ColorBtns({ colors, onPick }: { colors: PropertyColor[]; onPick: (c: PropertyColor) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {colors.map(c => (
        <button key={c} type="button" onClick={() => onPick(c)}
          className="rounded-lg px-3 py-2 text-sm font-medium text-white" style={{ background: COLOR_HEX[c] }}>
          {COLOR_LABELS[c]}
        </button>
      ))}
    </div>
  );
}

function PropBtns({ player, onPick, complete = true }: { player: PublicPlayer; onPick: (id: string) => void; complete?: boolean }) {
  const list = player.properties.filter(p => complete ? !isComplete(player, p.assignedColor) : !isComplete(player, p.assignedColor));
  return (
    <div className="flex flex-wrap gap-2">
      {list.map(p => (
        <button key={p.instanceId} type="button" onClick={() => onPick(p.instanceId)}
          className="rounded-lg bg-slate-700 px-3 py-2 text-sm hover:bg-slate-600">
          {p.displayName}
        </button>
      ))}
      {list.length === 0 && <p className="text-sm text-slate-400">Uygun mülk yok</p>}
    </div>
  );
}
