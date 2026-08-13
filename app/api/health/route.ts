import { NextResponse } from "next/server";

// 健康檢查端點：供 Coolify / Traefik 判斷容器是否已就緒
// 刻意不呼叫 Ragic，避免外部服務異常時連帶把本站判定為不健康
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    ok: true,
    time: new Date().toISOString(),
    ragicKeyConfigured: Boolean(process.env.RAGIC_API_KEY),
  });
}
