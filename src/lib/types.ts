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
  fromPlayerName: string;
  targetPlayerName: string;
  awaitingId: string;
  noCount: number;
  setColor?: PropertyColor;
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
  buildings: Partial<Record<PropertyColor, { house: boolean; hotel: boolean }>>;
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
  pendingSteal: PendingStealView | null;
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
  railroad: "Ulaşım", utility: "Kamu Hizmeti",
};

export const COLOR_HEX: Record<PropertyColor, string> = {
  brown: "#8B5E3C", light_blue: "#4FC3F7", pink: "#EC407A", orange: "#FF9800",
  red: "#E53935", yellow: "#FFEB3B", green: "#43A047", dark_blue: "#1E88E5",
  railroad: "#455A64", utility: "#78909C",
};

export const COLOR_BG: Record<PropertyColor, string> = {
  brown: "#F5E6D3", light_blue: "#E1F5FE", pink: "#FCE4EC", orange: "#FFF3E0",
  red: "#FFEBEE", yellow: "#FFFDE7", green: "#E8F5E9", dark_blue: "#E3F2FD",
  railroad: "#ECEFF1", utility: "#ECEFF1",
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
  pass_go: "GO", sly_deal: "🃏", forced_deal: "🔄", deal_breaker: "💥",
  debt_collector: "💸", birthday: "🎂", just_say_no: "🚫", double_rent: "×2",
  house: "🏠", hotel: "🏨", rent_dual: "💰", rent_any: "💰",
};
