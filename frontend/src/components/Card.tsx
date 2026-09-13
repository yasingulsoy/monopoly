"use client";

import type { CardInstance, PlacedProperty, PropertyColor, CardKind } from "@/lib/types";
import {
  COLOR_HEX, ACTION_TEXT, ACTION_BADGE, ACTION_HEADER,
  SET_RENTS, MONEY_STYLE, ALL_COLORS,
} from "@/lib/types";

interface Props {
  card: CardInstance | PlacedProperty;
  small?: boolean;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

/**
 * Kart, orijinal Java istemcisindeki CardPainter ile aynı ölçü sisteminde çizilir:
 * kart 56 × 86 birim, her şey bu birime göre konumlanır.
 */
const CARD_W = 56, CARD_H = 86;
const FULL_W = 106, SMALL_W = 68;

const LIGHT_COLORS: PropertyColor[] = ["yellow", "light_blue", "utility"];
const inkOn = (c: PropertyColor) => (LIGHT_COLORS.includes(c) ? "#1a1a1a" : "#ffffff");

/** Aksiyon/bina kartlarında değer halkası kırmızı, tapularda siyah */
const RING_RED = "#C80000";
const INK = "#1e1e1e";

/** Kart zemininin noktalı dokusu */
const DOTS = "radial-gradient(circle at 1px 1px, rgba(0,0,0,.10) 0.6px, transparent 0.7px)";

export function Card({ card, small, selected, onClick, disabled }: Props) {
  const color = "assignedColor" in card ? card.assignedColor : card.color;
  const kind = card.kind;

  const isMoney = kind === "money";
  const isProperty = kind === "property";
  const isWild = kind === "wild_property";
  const isAction = !isMoney && !isProperty && !isWild;

  const w = small ? SMALL_W : FULL_W;
  const h = Math.round((w / CARD_W) * CARD_H);
  const u = w / CARD_W; // 1 birim kaç piksel

  // Zemin rengi: tapular beyaz, para kendi rengi, aksiyonlar soluk krem ton
  const head = ACTION_HEADER[kind as CardKind] ?? "#455A64";
  const money = MONEY_STYLE[card.bankValue] ?? { bg: "#C8B88A", ink: "#5D4E24" };
  const bg = isMoney ? money.bg : isAction ? tint(head) : "#ffffff";
  const ringColor = isProperty || isWild ? INK : RING_RED;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || !onClick}
      className={[
        "font-display group relative shrink-0 overflow-hidden text-left transition-all",
        selected ? "z-10 scale-110 ring-[3px] ring-yellow-400" : "",
        onClick && !disabled ? "cursor-pointer hover:-translate-y-1 active:scale-95" : "",
        disabled ? "cursor-not-allowed opacity-50" : "",
      ].join(" ")}
      style={{
        width: w, height: h,
        borderRadius: u * 6,
        background: "#ffffff",
        boxShadow: selected ? "0 6px 16px rgba(0,0,0,.45)" : "0 2px 6px rgba(0,0,0,.35)",
      }}
    >
      {/* iç zemin + ince çerçeve çizgisi (Java: fillRect(3,3) + drawRect) */}
      <div
        className="absolute"
        style={{
          left: u * 3, top: u * 3, right: u * 3, bottom: u * 3,
          background: bg,
          backgroundImage: isProperty || isWild ? undefined : DOTS,
          backgroundSize: `${u * 2.2}px ${u * 2.2}px`,
          border: `${Math.max(1, u * 0.6)}px solid ${INK}`,
        }}
      />

      {isMoney && <MoneyFace v={card.bankValue} ink={money.ink} u={u} />}
      {isProperty && color && <PropertyFace card={card} color={color} u={u} small={small} />}
      {isWild && <WildFace card={card} u={u} small={small} />}
      {isAction && <ActionFace card={card} u={u} small={small} />}

      {/* değer daireleri — sol üst, aksiyon/para kartlarında ayrıca sağ alt */}
      {card.bankValue > 0 && (
        <>
          <ValueDot v={card.bankValue} u={u} ring={ringColor} fill={bg} x={4} y={4} />
          {!isProperty && !isWild && (
            <ValueDot v={card.bankValue} u={u} ring={ringColor} fill={bg} x={CARD_W - 16} y={CARD_H - 16} />
          )}
        </>
      )}
    </button>
  );
}

/** Aksiyon kartı zemini — kartın kendi renginin çok soluk hâli */
function tint(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const mix = (c: number) => Math.round(c * 0.1 + 248 * 0.9);
  return `rgb(${mix(r)},${mix(g)},${mix(b)})`;
}

/** Java: siyah/kırmızı halka + iç dolgu + ortada "3M" */
function ValueDot({ v, u, ring, fill, x, y }: { v: number; u: number; ring: string; fill: string; x: number; y: number }) {
  return (
    <span
      className="absolute z-20 flex items-center justify-center rounded-full"
      style={{
        left: u * x, top: u * y, width: u * 12, height: u * 12,
        background: fill,
        border: `${Math.max(1.2, u * 0.9)}px solid ${ring}`,
      }}
    >
      <span className="font-black leading-none" style={{ fontSize: u * (v < 10 ? 5.6 : 4.6), color: INK }}>
        {v}M
      </span>
    </span>
  );
}

function MoneyFace({ v, ink, u }: { v: number; ink: string; u: number }) {
  return (
    <span
      className="absolute z-10 flex items-center justify-center rounded-full"
      style={{
        left: u * 11, top: u * 26, width: u * 34, height: u * 34,
        border: `${Math.max(1.2, u * 0.9)}px solid ${INK}`,
        background: "rgba(255,255,255,.35)",
      }}
    >
      <span className="font-black leading-none" style={{ fontSize: u * (v < 10 ? 13 : 10), color: ink }}>
        {v}M
      </span>
    </span>
  );
}

/** Kira satırındaki mini tapu yelpazesi (Java: drawMiniProps) */
function MiniProps({ n, color, u }: { n: number; color: PropertyColor; u: number }) {
  return (
    <span className="relative inline-block shrink-0" style={{ width: u * 11, height: u * 9 }}>
      {Array.from({ length: n }).map((_, e) => (
        <span
          key={e}
          className="absolute overflow-hidden"
          style={{
            left: 0, bottom: 0, width: u * 6, height: u * 9,
            borderRadius: u * 1.6,
            background: "#ffffff",
            border: `${Math.max(0.8, u * 0.5)}px solid ${INK}`,
            transformOrigin: `${u * 1}px ${u * 8}px`,
            transform: `rotate(${-(n - 1 - e) * 15}deg)`,
            zIndex: e,
          }}
        >
          <span className="block w-full" style={{ height: u * 2.4, background: COLOR_HEX[color], borderBottom: `${Math.max(0.8, u * 0.5)}px solid ${INK}` }} />
        </span>
      ))}
      <span
        className="absolute z-10 flex items-center justify-center font-black leading-none"
        style={{ left: 0, bottom: 0, width: u * 6, height: u * 9, paddingTop: u * 2.4, fontSize: u * 4.4, color: INK }}
      >
        {n}
      </span>
    </span>
  );
}

function PropertyFace({
  card, color, u, small,
}: { card: CardInstance | PlacedProperty; color: PropertyColor; u: number; small?: boolean }) {
  const rents = SET_RENTS[color];
  const hex = COLOR_HEX[color];

  // Renk bandı + üstünde ilçe adı (Java: fillRect(6,6,W-12,16), isim y=9..22)
  const band = (
    <span
      className="absolute z-10 flex items-center justify-center"
      style={{
        left: u * 6, top: u * 6, width: u * (CARD_W - 12), height: u * 16,
        background: hex, border: `${Math.max(1, u * 0.6)}px solid ${INK}`,
      }}
    >
      {/* Java: değer rozeti varsa isim alanı sağa kaydırılır ki rozet yazıyı kapatmasın */}
      <span
        className="text-center font-black uppercase leading-[1.05]"
        style={{
          fontSize: u * (card.displayName.length > 12 ? 3.4 : 4.2),
          color: inkOn(color),
          paddingLeft: card.bankValue > 0 ? u * 9 : u * 2,
          paddingRight: u * 2,
        }}
      >
        {card.displayName}
      </span>
    </span>
  );

  if (small) {
    return (
      <>
        {band}
        <span className="absolute z-10 flex items-center justify-center"
          style={{ left: 0, right: 0, top: u * 24, bottom: u * 4 }}>
          <span className="font-black leading-none" style={{ fontSize: u * 9, color: INK }}>
            {rents[rents.length - 1]}M
          </span>
        </span>
      </>
    );
  }

  const rowH = 11;
  const top = 40;

  return (
    <>
      {band}
      {/* RENT başlığı ve sol açıklama */}
      <span className="absolute z-10 font-black uppercase leading-none"
        style={{ right: u * 8, top: u * 30, fontSize: u * 5.4, color: INK }}>
        Kira
      </span>
      <span className="absolute z-10 text-center font-sans leading-[1.1]"
        style={{ left: u * 7, top: u * 29, width: u * 16, fontSize: u * 2.6, color: "#555" }}>
        (settekİ kart sayısı)
      </span>

      {/* kira satırları: mini tapu yelpazesi · noktalı çizgi · değer */}
      {rents.map((r, i) => {
        const full = i === rents.length - 1;
        return (
          <span key={i} className="absolute z-10 flex items-center"
            style={{ left: u * 7, right: u * 6, top: u * (top + i * rowH), height: u * 9 }}>
            {full && (
              <span className="absolute" style={{ inset: `${-u}px ${-u * 1.5}px`, background: hex, opacity: 0.3, borderRadius: u }} />
            )}
            <span className="relative"><MiniProps n={i + 1} color={color} u={u} /></span>
            <span className="relative mx-[2px] flex-1"
              style={{ borderBottom: `${Math.max(1, u * 0.5)}px dotted ${INK}`, opacity: 0.55 }} />
            {full && (
              <span className="relative mr-[2px] font-black uppercase leading-none" style={{ fontSize: u * 2.6, color: INK }}>
                tam set
              </span>
            )}
            <span className="relative font-black leading-none" style={{ fontSize: u * 6.2, color: INK }}>
              {r}M
            </span>
          </span>
        );
      })}
    </>
  );
}

function WildFace({ card, u, small }: { card: CardInstance | PlacedProperty; u: number; small?: boolean }) {
  const isMulti = "isMultiWild" in card && card.isMultiWild;
  const list = isMulti ? ALL_COLORS : (card.colors ?? []);

  // Renk blokları + üstünde "JOKER TAPU" yazısı
  const band = (
    <span className="absolute z-10 flex overflow-hidden"
      style={{ left: u * 6, top: u * 6, width: u * (CARD_W - 12), height: u * 16, border: `${Math.max(1, u * 0.6)}px solid ${INK}` }}>
      {list.map(c => <span key={c} className="flex-1" style={{ background: COLOR_HEX[c] }} />)}
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="text-center font-black uppercase leading-[1.05] text-white"
          style={{ fontSize: u * 3.6, paddingLeft: u * 8, paddingRight: u * 2, textShadow: `0 0 ${u}px #000, 0 0 ${u}px #000` }}>
          Joker Tapu
        </span>
      </span>
    </span>
  );

  if (small) return band;

  if (isMulti) {
    return (
      <>
        {band}
        <span className="absolute z-10 flex flex-col items-center" style={{ left: u * 6, right: u * 6, top: u * 28 }}>
          <span className="font-black leading-none" style={{ fontSize: u * 16, color: INK }}>{ALL_COLORS.length}</span>
          <span className="mt-[2px] text-center font-sans leading-[1.2]" style={{ fontSize: u * 3, color: "#444" }}>
            Her rengin yerine geçer. Para değeri yoktur, ödeme yapılamaz.
          </span>
        </span>
      </>
    );
  }

  // İki renkli joker: her renk için ayrı kira sütunu (Java: isBiColor)
  return (
    <>
      {band}
      {list.map((c, ci) => {
        const rents = SET_RENTS[c];
        const colLeft = ci === 0 ? 5 : CARD_W / 2 + 1;
        return (
          <span key={c}>
            <span className="absolute z-10 text-center font-black uppercase leading-none"
              style={{ left: u * colLeft, width: u * (CARD_W / 2 - 6), top: u * 28, fontSize: u * 4.6, color: INK }}>
              Kira
            </span>
            {rents.map((r, i) => (
              <span key={i} className="absolute z-10 flex items-center"
                style={{ left: u * colLeft, width: u * (CARD_W / 2 - 6), top: u * (36 + i * 10), height: u * 9 }}>
                <MiniProps n={i + 1} color={c} u={u} />
                <span className="ml-auto font-black leading-none" style={{ fontSize: u * 5, color: INK }}>{r}M</span>
              </span>
            ))}
          </span>
        );
      })}
    </>
  );
}

function ActionFace({ card, u, small }: { card: CardInstance | PlacedProperty; u: number; small?: boolean }) {
  const kind = card.kind as CardKind;
  const label = ACTION_BADGE[kind] ?? card.displayName;
  const text = ACTION_TEXT[kind];
  const isRent = kind === "rent_dual" || kind === "rent_any";
  const rentColors = isRent ? (kind === "rent_any" ? ALL_COLORS : (card.colors ?? [])) : [];
  const d = isRent ? 36 : 34;

  // Kira kartlarında daire, renklerden oluşan pasta dilimi (Java: fillArc)
  const pie = rentColors.length
    ? `conic-gradient(${rentColors
        .map((c, i) => `${COLOR_HEX[c]} ${(i / rentColors.length) * 100}% ${((i + 1) / rentColors.length) * 100}%`)
        .join(",")})`
    : undefined;

  const circle = (
    <span
      className="absolute z-10 flex items-center justify-center rounded-full"
      style={{
        left: u * ((CARD_W - d) / 2), top: u * (small ? 24 : 25),
        width: u * d, height: u * d,
        border: `${Math.max(1.2, u * 0.9)}px solid ${INK}`,
        background: pie ?? "#ffffff",
        padding: pie ? u * 4 : 0,
      }}
    >
      <span className="flex h-full w-full items-center justify-center rounded-full bg-white px-[1px]">
        <span className="text-center font-black uppercase leading-[1.02]"
          style={{ fontSize: u * (label.length <= 6 ? 5.4 : label.length <= 11 ? 4 : 3.3), color: INK }}>
          {label}
        </span>
      </span>
    </span>
  );

  if (small) return <>{circle}</>;

  return (
    <>
      <span className="absolute z-10 text-center font-black uppercase leading-none"
        style={{ left: u * 6, right: u * 6, top: u * 17, fontSize: u * 4.2, color: INK, letterSpacing: u * 0.2 }}>
        Hamle Kartı
      </span>
      {circle}
      {text && (
        <span className="absolute z-10 text-center font-sans leading-[1.25]"
          style={{ left: u * 7, right: u * 7, top: u * 63, fontSize: u * 2.9, color: "#333" }}>
          {text}
        </span>
      )}
    </>
  );
}

/** Kart arkası — çekme destesi için */
export function CardBack({ small }: { small?: boolean }) {
  const w = small ? SMALL_W : FULL_W;
  const h = Math.round((w / CARD_W) * CARD_H);
  const u = w / CARD_W;
  return (
    <div className="font-display relative shrink-0 overflow-hidden"
      style={{ width: w, height: h, borderRadius: u * 6, background: "#fff", boxShadow: "0 2px 6px rgba(0,0,0,.35)" }}>
      <div className="absolute" style={{ left: u * 3, top: u * 3, right: u * 3, bottom: u * 3, background: "#C8161D", border: `${u * 0.6}px solid ${INK}` }}>
        <div className="absolute inset-0" style={{
          background: "repeating-linear-gradient(135deg,rgba(255,255,255,.08) 0 6px,transparent 6px 12px)",
        }} />
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 rotate-[-10deg] border-y border-white/40 bg-[#12315B] text-center"
          style={{ paddingBlock: u * 3 }}>
          <div className="font-black uppercase leading-none tracking-[0.1em] text-white" style={{ fontSize: u * 5 }}>İstanbul</div>
          <div className="font-black uppercase leading-none tracking-[0.28em] text-yellow-300" style={{ fontSize: u * 6.5 }}>Deal</div>
        </div>
      </div>
    </div>
  );
}
