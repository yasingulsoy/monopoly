"use client";

import type { CardInstance, PlacedProperty, PropertyColor, CardKind } from "@/lib/types";
import { COLOR_HEX, COLOR_BG, COLOR_LABELS, ACTION_ICONS } from "@/lib/types";

interface Props {
  card: CardInstance | PlacedProperty;
  small?: boolean;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

export function Card({ card, small, selected, onClick, disabled }: Props) {
  const color = "assignedColor" in card ? card.assignedColor : card.color;
  const colors = "colors" in card ? card.colors : undefined;
  const kind = card.kind;

  const isMoney = kind === "money";
  const isProperty = kind === "property";
  const isWild = kind === "wild_property";
  const isAction = !isMoney && !isProperty && !isWild;

  const baseSize = small ? "h-[5.5rem] w-[4rem]" : "h-[8.5rem] w-[6rem]";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || !onClick}
      className={[
        "group relative flex flex-col overflow-hidden rounded-xl border-2 text-left shadow-md transition-all",
        baseSize,
        selected
          ? "scale-110 border-yellow-400 ring-2 ring-yellow-300 shadow-yellow-400/30 z-10"
          : "border-slate-300/60",
        onClick && !disabled
          ? "cursor-pointer hover:-translate-y-1 hover:shadow-xl hover:border-white/80 active:scale-95"
          : "",
        disabled ? "opacity-50 cursor-not-allowed" : "",
      ].join(" ")}
    >
      {isMoney && <MoneyFace card={card} small={small} />}
      {isProperty && color && <PropertyFace card={card} color={color} small={small} />}
      {isWild && <WildFace card={card} colors={colors} small={small} />}
      {isAction && <ActionFace card={card} small={small} />}
    </button>
  );
}

function MoneyFace({ card, small }: { card: CardInstance | PlacedProperty; small?: boolean }) {
  const val = card.bankValue;
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-b from-emerald-100 to-emerald-50">
      <div className={`font-black text-emerald-700 ${small ? "text-lg" : "text-2xl"}`}>
        {val}M
      </div>
      <div className={`text-emerald-600 font-bold ${small ? "text-[7px]" : "text-[9px]"}`}>
        PARA
      </div>
    </div>
  );
}

function PropertyFace({ card, color, small }: { card: CardInstance | PlacedProperty; color: PropertyColor; small?: boolean }) {
  return (
    <div className="flex h-full w-full flex-col" style={{ background: COLOR_BG[color] }}>
      <div className={`w-full ${small ? "h-5" : "h-7"}`} style={{ background: COLOR_HEX[color] }} />
      <div className="flex flex-1 flex-col items-center justify-center px-1">
        <span className={`text-center font-bold leading-tight text-slate-800 ${small ? "text-[7px]" : "text-[9px]"}`}>
          {card.displayName}
        </span>
      </div>
      <div className="flex items-center justify-between px-1.5 pb-1">
        <span className={`rounded-sm px-1 font-bold text-white ${small ? "text-[6px]" : "text-[8px]"}`} style={{ background: COLOR_HEX[color] }}>
          {COLOR_LABELS[color]}
        </span>
        {card.bankValue > 0 && (
          <span className={`rounded-full bg-red-600 px-1 font-bold text-white ${small ? "text-[6px]" : "text-[8px]"}`}>
            {card.bankValue}M
          </span>
        )}
      </div>
    </div>
  );
}

function WildFace({ card, colors, small }: { card: CardInstance | PlacedProperty; colors?: PropertyColor[]; small?: boolean }) {
  const isMulti = "isMultiWild" in card && card.isMultiWild;
  if (isMulti) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-purple-100 via-pink-100 to-yellow-100">
        <div className={`mb-1 grid grid-cols-5 gap-px ${small ? "h-3" : "h-4"}`}>
          {["#8B5E3C","#4FC3F7","#EC407A","#FF9800","#E53935","#FFEB3B","#43A047","#1E88E5","#455A64","#78909C"].map((c,i) => (
            <div key={i} className="w-1.5 rounded-sm" style={{ background: c }} />
          ))}
        </div>
        <span className={`text-center font-black text-slate-700 ${small ? "text-[7px]" : "text-[9px]"}`}>
          JOKER
        </span>
        <span className={`text-center text-slate-500 ${small ? "text-[5px]" : "text-[7px]"}`}>
          Tüm renkler
        </span>
      </div>
    );
  }

  const c1 = colors?.[0];
  const c2 = colors?.[1];
  return (
    <div className="flex h-full w-full flex-col">
      <div className={`w-full ${small ? "h-5" : "h-7"}`} style={{
        background: c1 && c2 ? `linear-gradient(90deg, ${COLOR_HEX[c1]} 50%, ${COLOR_HEX[c2]} 50%)` : "#888"
      }} />
      <div className="flex flex-1 flex-col items-center justify-center bg-white px-1">
        <span className={`text-center font-bold leading-tight text-slate-700 ${small ? "text-[6px]" : "text-[8px]"}`}>
          {card.displayName}
        </span>
      </div>
      <div className="flex items-center justify-between bg-white px-1 pb-1">
        <div className="flex gap-0.5">
          {c1 && <span className={`rounded-sm px-0.5 font-bold text-white ${small ? "text-[5px]" : "text-[7px]"}`} style={{ background: COLOR_HEX[c1] }}>{COLOR_LABELS[c1].slice(0,3)}</span>}
          {c2 && <span className={`rounded-sm px-0.5 font-bold text-white ${small ? "text-[5px]" : "text-[7px]"}`} style={{ background: COLOR_HEX[c2] }}>{COLOR_LABELS[c2].slice(0,3)}</span>}
        </div>
        {card.bankValue > 0 && (
          <span className={`rounded-full bg-red-600 px-1 font-bold text-white ${small ? "text-[6px]" : "text-[8px]"}`}>{card.bankValue}M</span>
        )}
      </div>
    </div>
  );
}

function ActionFace({ card, small }: { card: CardInstance | PlacedProperty; small?: boolean }) {
  const kind = card.kind as CardKind;
  const icon = ACTION_ICONS[kind] ?? "?";
  const bgColors: Partial<Record<CardKind, string>> = {
    pass_go: "from-blue-50 to-blue-100",
    sly_deal: "from-violet-50 to-violet-100",
    forced_deal: "from-indigo-50 to-indigo-100",
    deal_breaker: "from-red-50 to-red-100",
    debt_collector: "from-amber-50 to-amber-100",
    birthday: "from-pink-50 to-pink-100",
    just_say_no: "from-rose-50 to-rose-100",
    double_rent: "from-orange-50 to-orange-100",
    house: "from-green-50 to-green-100",
    hotel: "from-red-50 to-orange-100",
    rent_dual: "from-yellow-50 to-amber-100",
    rent_any: "from-yellow-50 to-amber-100",
  };

  return (
    <div className={`flex h-full w-full flex-col items-center justify-between bg-gradient-to-b ${bgColors[kind] ?? "from-gray-50 to-gray-100"} p-1.5`}>
      <div className={`flex items-center justify-center ${small ? "text-lg" : "text-2xl"}`}>
        {icon}
      </div>
      <span className={`text-center font-bold leading-tight text-slate-800 ${small ? "text-[6px]" : "text-[8px]"}`}>
        {card.displayName}
      </span>
      {card.bankValue > 0 && (
        <span className={`rounded-full bg-red-600 px-1.5 font-bold text-white ${small ? "text-[6px]" : "text-[8px]"}`}>
          {card.bankValue}M
        </span>
      )}
    </div>
  );
}
