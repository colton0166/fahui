import crypto from "crypto";
import { MAX_TABLET_LIMIT, TABLET_CONFIGS } from "./tablets";

// 報名連結的數量限制以 HMAC 簽章保護：payload.簽章
// 金鑰只存在伺服器端環境變數，客人改動網址任一字元都會驗證失敗。
// 此檔僅供 API route（伺服器端）使用，不可被 client component 匯入。

const SECRET = process.env.LINK_SIGNING_SECRET || "";

export function isSigningConfigured(): boolean {
  return SECRET.length > 0;
}

export function isPasswordRequired(): boolean {
  return Boolean(process.env.STAFF_PASSWORD);
}

export function checkStaffPassword(input: unknown): boolean {
  const expected = process.env.STAFF_PASSWORD;
  if (!expected) return true; // 未設定密碼時不擋，僅在畫面上提醒
  if (typeof input !== "string" || input.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(input), Buffer.from(expected));
}

function sign(payload: string): string {
  return crypto
    .createHmac("sha256", SECRET)
    .update(payload)
    .digest("base64url")
    .slice(0, 22);
}

// 僅保留實際存在的牌位種類，並把數值夾在 0〜MAX_TABLET_LIMIT
function sanitize(input: Record<string, unknown>): Record<string, number> {
  const limits: Record<string, number> = {};
  TABLET_CONFIGS.forEach((cfg) => {
    const raw = input[cfg.key];
    const n = typeof raw === "number" ? raw : Number(raw);
    if (!Number.isFinite(n) || n < 0) return;
    limits[cfg.key] = Math.min(Math.floor(n), MAX_TABLET_LIMIT);
  });
  return limits;
}

export function createLimitsToken(input: Record<string, unknown>): string {
  const limits = sanitize(input);
  // 加入隨機值，讓相同數量組合每次產生的連結都不一樣
  const body = { l: limits, n: crypto.randomBytes(6).toString("base64url") };
  const payload = Buffer.from(JSON.stringify(body), "utf8").toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifyLimitsToken(
  token: string
): Record<string, number> | null {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;

  const payload = token.slice(0, dot);
  const given = token.slice(dot + 1);
  const expected = sign(payload);

  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const body = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    );
    if (!body || typeof body.l !== "object" || body.l === null) return null;
    return sanitize(body.l);
  } catch {
    return null;
  }
}
