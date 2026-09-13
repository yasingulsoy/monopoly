import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Yerelde backend/.env okunur; sunucuda değişkenler platformdan gelir (dotenv onları ezmez).
dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.env") });

export function loadAllowedNames(): string[] {
  const names: string[] = [];
  for (let i = 1; i <= 8; i++) {
    const v = process.env[`PLAYER${i}_NAME`];
    if (v?.trim()) names.push(v.trim());
  }
  return names.length ? names : ["yasin", "yunus", "serkan", "zorbey"];
}

/** Sondaki "/" farkı CORS'u boşuna bozmasın */
const norm = (u: string) => u.trim().replace(/\/+$/, "").toLowerCase();

/** FRONTEND_URL virgülle birden fazla adres alabilir (ör. vercel preview + production) */
export const ALLOWED_ORIGINS: string[] = (process.env.FRONTEND_URL ?? "http://localhost:3000")
  .split(",")
  .map(norm)
  .filter(Boolean);

export function isAllowedOrigin(origin?: string): boolean {
  // origin yoksa (curl, health check, aynı köken) serbest bırak
  if (!origin) return true;
  return ALLOWED_ORIGINS.includes(norm(origin));
}

export const PORT = Number(process.env.PORT ?? 3001);
/** Sunucular dış arayüze bağlanmayı bekler */
export const HOST = process.env.HOST ?? "0.0.0.0";
export const MIN_PLAYERS = Number(process.env.MIN_PLAYERS ?? 2);
export const MAX_PLAYERS = Number(process.env.MAX_PLAYERS ?? 5);
