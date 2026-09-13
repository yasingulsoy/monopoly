"use client";

import { Card, CardBack } from "@/components/Card";
import { SET_BANK_VALUE } from "@/lib/types";
import type { CardInstance, CardKind, PropertyColor } from "@/lib/types";

let n = 0;
const id = () => `preview_${n++}`;

const DISTRICTS: Record<PropertyColor, string> = {
  brown: "Kasımpaşa", light_blue: "Sultanahmet", pink: "Beyoğlu",
  orange: "Harbiye", red: "Bostancı", yellow: "Nişantaşı",
  green: "Bakırköy", dark_blue: "Tarabya", railroad: "Haydarpaşa Garı",
  utility: "Elektrik İdaresi",
};

const properties: CardInstance[] = (Object.keys(DISTRICTS) as PropertyColor[]).map(color => ({
  instanceId: id(), kind: "property", displayName: DISTRICTS[color],
  bankValue: SET_BANK_VALUE[color], color,
}));

const money: CardInstance[] = [1, 2, 3, 4, 5, 10].map(v => ({
  instanceId: id(), kind: "money", displayName: `${v}M`, bankValue: v, moneyValue: v,
}));

const wilds: CardInstance[] = [
  { instanceId: id(), kind: "wild_property", displayName: "Joker (Pembe/Turuncu)", bankValue: 2, colors: ["pink", "orange"] },
  { instanceId: id(), kind: "wild_property", displayName: "Joker (Koyu Mavi/Yeşil)", bankValue: 2, colors: ["dark_blue", "green"] },
  { instanceId: id(), kind: "wild_property", displayName: "Joker (İstasyon/Kamu Kuruluşu)", bankValue: 2, colors: ["railroad", "utility"] },
  { instanceId: id(), kind: "wild_property", displayName: "Çok Renkli Joker", bankValue: 0, isMultiWild: true },
];

const actions: CardInstance[] = ([
  ["rent_dual", "Kırmızı / Sarı Kira", 1],
  ["rent_any", "Joker Kira", 3],
  ["pass_go", "Geçiş Ücreti", 1],
  ["sly_deal", "Tapu Devri", 3],
  ["forced_deal", "Değiş Tokuş", 3],
  ["deal_breaker", "Haciz", 5],
  ["debt_collector", "Borç Tahsildarı", 3],
  ["birthday", "Doğum Günüm", 2],
  ["just_say_no", "Reddet", 4],
  ["double_rent", "Kirayı Katla", 1],
  ["house", "Ev", 3],
  ["hotel", "Otel", 4],
] as [CardKind, string, number][]).map(([kind, displayName, bankValue]) => ({
  instanceId: id(), kind, displayName, bankValue,
  colors: kind === "rent_dual" ? (["red", "yellow"] as PropertyColor[]) : undefined,
}));

function Row({ title, cards, small }: { title: string; cards: CardInstance[]; small?: boolean }) {
  return (
    <section className="mb-10">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-slate-400">{title}</h2>
      <div className="flex flex-wrap gap-3">
        {cards.map(c => <Card key={c.instanceId} card={c} small={small} />)}
      </div>
    </section>
  );
}

export default function KartlarPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-1 font-display text-3xl font-bold text-white">Kart Tasarımları</h1>
      <p className="mb-8 text-sm text-slate-400">
        Tüm kart yüzleri — oyunu çalıştırmadan tasarımı gözden geçirmek için.
      </p>

      <Row title="Tapu Senedi Kartları" cards={properties} />
      <Row title="Joker Tapu Senedi" cards={wilds} />
      <Row title="Hamle Kartları" cards={actions} />
      <Row title="Para Kartları" cards={money} />

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-slate-400">Kart Arkası</h2>
        <div className="flex gap-3">
          <CardBack />
          <CardBack small />
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-slate-400">
          Küçük Boy (masa üstü / banka)
        </h2>
        <div className="flex flex-wrap gap-2">
          {[...properties.slice(0, 5), ...wilds, ...actions.slice(0, 5), ...money.slice(0, 3)].map(c => (
            <Card key={`s_${c.instanceId}`} card={c} small />
          ))}
        </div>
      </section>
    </main>
  );
}
