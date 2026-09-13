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

export interface PendingStealView {
  id: string;
  type: "sly_deal" | "forced_deal" | "deal_breaker";
  fromPlayerId: string;
  fromPlayerName: string;
  targetPlayerId: string;
  targetPlayerName: string;
  awaitingId: string;
  noCount: number;
  setColor?: PropertyColor;
}

export interface PendingPayChallengeView {
  paymentId: string;
  noCount: number;
  awaitingId: string;
  debtorName: string;
  creditorName: string;
}

export interface ChatMessage {
  id: string;
  playerName: string;
  text: string;
  timestamp: number;
}

export interface PublicPlayer {
  id: string;
  name: string;
  handCount: number;
  bank: CardInstance[];
  properties: PlacedProperty[];
  /** houseId/hotelId yalnızca kendi kartların için gelir — ödemede seçilebilsinler diye */
  buildings: Partial<Record<PropertyColor, { house: boolean; hotel: boolean; houseId?: string; hotelId?: string }>>;
  connected: boolean;
  completeSetCount: number;
}

export interface GameState {
  phase: "lobby" | "playing" | "finished";
  players: PublicPlayer[];
  currentPlayerId: string | null;
  turnPhase: string;
  playsRemaining: number;
  drawPileCount: number;
  winnerName: string | null;
  announcement: string | null;
  activePayment: PaymentRequest | null;
  /** Sıradaki tüm ödemeler (herkese görünür) — 4 kişide Doğum Günü 3 sıralı ödeme demek */
  paymentQueue: { id: string; fromName: string; toName: string; amount: number; active: boolean }[];
  pendingSteal: PendingStealView | null;
  pendingPayChallenge: PendingPayChallengeView | null;
  logs: { id: string; message: string }[];
  chat: ChatMessage[];
  myHand?: CardInstance[];
  myId?: string;
  allowedNames: string[];
  minPlayers: number;
  maxPlayers: number;
}

export interface PlayActionParams {
  cardId: string;
  targetColor?: PropertyColor;
  targetPlayerId?: string;
  myPropertyId?: string;
  theirPropertyId?: string;
  setColor?: PropertyColor;
}

export const COLOR_LABELS: Record<PropertyColor, string> = {
  brown: "Kahverengi", light_blue: "Açık Mavi", pink: "Pembe", orange: "Turuncu",
  red: "Kırmızı", yellow: "Sarı", green: "Yeşil", dark_blue: "Koyu Mavi",
  railroad: "İstasyon", utility: "Kamu Kuruluşları",
};

export const COLOR_HEX: Record<PropertyColor, string> = {
  brown: "#8B5E3C", light_blue: "#4FC3F7", pink: "#EC407A", orange: "#FF9800",
  red: "#E53935", yellow: "#FFEB3B", green: "#43A047", dark_blue: "#1E88E5",
  railroad: "#212121", utility: "#9CCC65",
};

export const COLOR_BG: Record<PropertyColor, string> = {
  brown: "#F5E6D3", light_blue: "#E1F5FE", pink: "#FCE4EC", orange: "#FFF3E0",
  red: "#FFEBEE", yellow: "#FFFDE7", green: "#E8F5E9", dark_blue: "#E3F2FD",
  railroad: "#ECEFF1", utility: "#F1F8E9",
};

export const ALL_COLORS: PropertyColor[] = [
  "brown", "light_blue", "pink", "orange", "red",
  "yellow", "green", "dark_blue", "railroad", "utility",
];

export const SET_SIZES: Record<PropertyColor, number> = {
  brown: 2, light_blue: 3, pink: 3, orange: 3, red: 3,
  yellow: 3, green: 3, dark_blue: 2, railroad: 4, utility: 2,
};

export const ACTION_ICONS: Partial<Record<CardKind, string>> = {
  pass_go: "GO", sly_deal: "✋", forced_deal: "🔄", deal_breaker: "⚖️",
  debt_collector: "💸", birthday: "🎂", just_say_no: "🚫", double_rent: "×2",
  house: "🏠", hotel: "🏨", rent_dual: "💰", rent_any: "💰",
};

/** Arsanın banka/ödeme değeri — renk grubuna sabit, karta göre değişmez */
export const SET_BANK_VALUE: Record<PropertyColor, number> = {
  brown: 1, light_blue: 1, pink: 2, orange: 2, red: 3,
  yellow: 3, green: 4, dark_blue: 4, railroad: 2, utility: 2,
};

/** Tapu kartının üzerinde basılı kira merdiveni (sahip olunan kart sayısı → kira) */
export const SET_RENTS: Record<PropertyColor, number[]> = {
  brown: [1, 2], light_blue: [1, 2, 3], pink: [1, 2, 4], orange: [1, 3, 5],
  red: [2, 3, 6], yellow: [2, 4, 6], green: [2, 4, 7], dark_blue: [3, 8],
  railroad: [1, 2, 3, 4], utility: [1, 2],
};

/**
 * Kartın ortasındaki dairenin içinde yazan kısa metin — kartın ne yaptığını söyler.
 * (Java'daki CardPainter'ın daire içine bastığı displayName'in karşılığı.)
 */
export const ACTION_BADGE: Partial<Record<CardKind, string>> = {
  pass_go: "2 KART ÇEK",
  sly_deal: "TAPU DEVRİ",
  forced_deal: "DEĞİŞ TOKUŞ",
  deal_breaker: "HACİZ",
  debt_collector: "5M TAHSİL",
  birthday: "DOĞUM GÜNÜM",
  just_say_no: "REDDET",
  double_rent: "KİRA ×2",
  house: "EV",
  hotel: "OTEL",
  rent_dual: "KİRA",
  rent_any: "KİRA",
};

/** Hamle kartlarının üzerindeki açıklama metni */
export const ACTION_TEXT: Partial<Record<CardKind, string>> = {
  pass_go: "Kart çekme destesinden 2 kart çek.",
  sly_deal: "Rakibinden 1 tapu senedi al. Tam setten alamazsın.",
  forced_deal: "Kendi tapunla rakibinkini takas et. Tam setten olamaz.",
  deal_breaker: "Rakibinin tam bir setini al. Ev ve Otel dahil.",
  debt_collector: "Seçtiğin bir oyuncudan 5M tahsil et.",
  birthday: "Tüm oyuncular sana 2M versin.",
  just_say_no: "Sana karşı oynanan bir Hamle kartını iptal et.",
  double_rent: "Kira kartıyla birlikte oyna, kirayı 2 katına çıkar.",
  house: "Tam arsa setinin üzerine koy, kira gelirine 3M ekle.",
  hotel: "Üzerinde Ev olan tam setin üzerine koy, 4M ekle.",
  rent_dual: "Bu renklerden birine sahipsen herkesten kira al.",
  rent_any: "İstediğin bir renk için tek oyuncudan kira al.",
};

/** Hamle kartı başlık bandının rengi */
export const ACTION_HEADER: Partial<Record<CardKind, string>> = {
  pass_go: "#1E88E5", sly_deal: "#7E57C2", forced_deal: "#5C6BC0",
  deal_breaker: "#C62828", debt_collector: "#EF6C00", birthday: "#EC407A",
  just_say_no: "#D81B60", double_rent: "#F4511E", house: "#2E7D32",
  hotel: "#2E7D32", rent_dual: "#F9A825", rent_any: "#F9A825",
};

/** Para kartı renkleri (değere göre) */
export const MONEY_STYLE: Record<number, { bg: string; ink: string }> = {
  1: { bg: "#B0BEC5", ink: "#37474F" }, 2: { bg: "#66BB6A", ink: "#1B5E20" },
  3: { bg: "#FFCA28", ink: "#E65100" }, 4: { bg: "#42A5F5", ink: "#0D47A1" },
  5: { bg: "#AB47BC", ink: "#4A148C" }, 10: { bg: "#FF7043", ink: "#BF360C" },
};
