export type PropertyColor =
  | "brown" | "light_blue" | "pink" | "orange" | "red"
  | "yellow" | "green" | "dark_blue" | "railroad" | "utility";

export type CardKind =
  | "money" | "property" | "wild_property" | "rent_dual" | "rent_any"
  | "pass_go" | "sly_deal" | "forced_deal" | "deal_breaker"
  | "debt_collector" | "birthday" | "just_say_no" | "double_rent" | "house" | "hotel";

export interface CardInstance {
  instanceId: string;
  kind: CardKind;
  displayName: string;
  bankValue: number;
  moneyValue?: number;
  colors?: PropertyColor[];
  color?: PropertyColor;
  isMultiWild?: boolean;
}

export interface PlacedProperty {
  instanceId: string;
  assignedColor: PropertyColor;
  kind: CardKind;
  displayName: string;
  bankValue: number;
  isMultiWild?: boolean;
  colors?: PropertyColor[];
}

export interface PaymentRequest {
  id: string;
  fromPlayerId: string;
  toPlayerId: string;
  amount: number;
  reason: string;
}

export interface PlayActionParams {
  cardId: string;
  targetColor?: PropertyColor;
  targetPlayerId?: string;
  myPropertyId?: string;
  theirPropertyId?: string;
  setColor?: PropertyColor;
}

/**
 * bankValue: arsanın banka/ödeme değeri — renk grubuna sabittir, karta göre değişmez.
 * (Örn. koyu mavi setinin iki kartı da 4M; kira merdiveni ise 3M/8M.)
 */
export const SETS: Record<PropertyColor, { size: number; rent: number[]; names: string[]; bankValue: number }> = {
  brown: { size: 2, rent: [1, 2], names: ["Kasımpaşa", "Dolapdere"], bankValue: 1 },
  light_blue: { size: 3, rent: [1, 2, 3], names: ["Sultanahmet", "Karaköy", "Sirkeci"], bankValue: 1 },
  pink: { size: 3, rent: [1, 2, 4], names: ["Beyoğlu", "Beşiktaş", "Taksim"], bankValue: 2 },
  orange: { size: 3, rent: [1, 3, 5], names: ["Harbiye", "Şişli", "Mecidiyeköy"], bankValue: 2 },
  red: { size: 3, rent: [2, 3, 6], names: ["Bostancı", "Erenköy", "Caddebostan"], bankValue: 3 },
  yellow: { size: 3, rent: [2, 4, 6], names: ["Nişantaşı", "Teşvikiye", "Maçka"], bankValue: 3 },
  green: { size: 3, rent: [2, 4, 7], names: ["Bakırköy", "Yeşilköy", "Levent"], bankValue: 4 },
  dark_blue: { size: 2, rent: [3, 8], names: ["Tarabya", "Yeniköy"], bankValue: 4 },
  railroad: { size: 4, rent: [1, 2, 3, 4], names: ["Haydarpaşa Garı", "Sirkeci Garı", "Alsancak Garı", "Basmane Garı"], bankValue: 2 },
  utility: { size: 2, rent: [1, 2], names: ["Elektrik İdaresi", "Sular İdaresi"], bankValue: 2 },
};

export const LABELS: Record<PropertyColor, string> = {
  brown: "Kahverengi", light_blue: "Açık Mavi", pink: "Pembe", orange: "Turuncu",
  red: "Kırmızı", yellow: "Sarı", green: "Yeşil", dark_blue: "Koyu Mavi",
  railroad: "İstasyon", utility: "Kamu Kuruluşları",
};

export const BUILDABLE: PropertyColor[] = ["brown","light_blue","pink","orange","red","yellow","green","dark_blue"];
