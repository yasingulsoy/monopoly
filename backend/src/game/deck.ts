import type { CardInstance, PropertyColor } from "./types.js";
import { SETS } from "./types.js";

let cid = 0;
const id = () => `card_${cid++}_${Math.random().toString(36).slice(2, 7)}`;

function shuffle<T>(a: T[]): T[] {
  const c = [...a];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c;
}

export function createDeck(): CardInstance[] {
  const cards: CardInstance[] = [];

  for (const [color, def] of Object.entries(SETS) as [PropertyColor, typeof SETS[PropertyColor]][]) {
    def.names.forEach((name) => cards.push({
      instanceId: id(), kind: "property", displayName: name,
      bankValue: def.bankValue, color,
    }));
  }

  const wilds: [string, PropertyColor[] | null, number][] = [
    ["Joker (Kahverengi/Açık Mavi)", ["brown","light_blue"], 1],
    ["Joker (Pembe/Turuncu)", ["pink","orange"], 2],
    ["Joker (Kırmızı/Sarı)", ["red","yellow"], 2],
    ["Joker (Koyu Mavi/Yeşil)", ["dark_blue","green"], 1],
    ["Joker (İstasyon/Kamu Kuruluşu)", ["railroad","utility"], 1],
    ["Joker (İstasyon/Açık Mavi)", ["railroad","light_blue"], 1],
    ["Joker (İstasyon/Yeşil)", ["railroad","green"], 1],
    ["Çok Renkli Joker", null, 2],
  ];
  for (const [name, colors, n] of wilds) {
    for (let i = 0; i < n; i++) cards.push({
      instanceId: id(), kind: "wild_property", displayName: name,
      bankValue: colors ? 2 : 0, colors: colors ?? undefined, isMultiWild: !colors,
    });
  }

  const rents: [string, PropertyColor[], number][] = [
    ["Kahverengi / Açık Mavi Kira", ["brown","light_blue"], 2],
    ["Pembe / Turuncu Kira", ["pink","orange"], 2],
    ["Kırmızı / Sarı Kira", ["red","yellow"], 2],
    ["Koyu Mavi / Yeşil Kira", ["dark_blue","green"], 2],
    ["İstasyon / Kamu Kuruluşları Kira", ["railroad","utility"], 2],
  ];
  for (const [name, colors, n] of rents) {
    for (let i = 0; i < n; i++) cards.push({ instanceId: id(), kind: "rent_dual", displayName: name, bankValue: 1, colors });
  }
  for (let i = 0; i < 3; i++) cards.push({ instanceId: id(), kind: "rent_any", displayName: "Joker Kira", bankValue: 3 });

  const actions: [CardInstance["kind"], string, number, number][] = [
    ["pass_go","Geçiş Ücreti",10,1], ["sly_deal","Tapu Devri",3,3], ["forced_deal","Değiş Tokuş",3,3],
    ["deal_breaker","Haciz",2,5], ["debt_collector","Borç Tahsildarı",3,3], ["birthday","Doğum Günüm",3,2],
    ["just_say_no","Reddet",3,4], ["double_rent","Kirayı Katla",2,1], ["house","Ev",3,3], ["hotel","Otel",2,4],
  ];
  for (const [kind, name, n, bank] of actions) {
    for (let i = 0; i < n; i++) cards.push({ instanceId: id(), kind, displayName: name, bankValue: bank });
  }

  for (const [val, n] of [[1,6],[2,5],[3,3],[4,3],[5,2],[10,1]] as [number,number][]) {
    for (let i = 0; i < n; i++) cards.push({ instanceId: id(), kind: "money", displayName: `${val}M`, bankValue: val, moneyValue: val });
  }

  return cards;
}

export { shuffle };
