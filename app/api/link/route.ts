import { NextRequest, NextResponse } from "next/server";
import {
  checkStaffPassword,
  createLimitsToken,
  isPasswordRequired,
  isSigningConfigured,
  verifyLimitsToken,
} from "@/lib/linkToken";

export const dynamic = "force-dynamic";

// GET /api/link?k=<token> → 驗證連結，回傳各牌位可填數量
// GET /api/link            → 回報伺服器端設定狀態（供 /staff 顯示提示）
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("k");

  if (!token) {
    return NextResponse.json({
      signingConfigured: isSigningConfigured(),
      passwordRequired: isPasswordRequired(),
    });
  }

  if (!isSigningConfigured()) {
    return NextResponse.json(
      { ok: false, error: "伺服器未設定連結金鑰" },
      { status: 503 }
    );
  }

  const limits = verifyLimitsToken(token);
  if (!limits) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  return NextResponse.json({ ok: true, limits });
}

// POST /api/link → 由 /staff 產生已簽章的連結參數
export async function POST(request: NextRequest) {
  if (!isSigningConfigured()) {
    return NextResponse.json(
      { error: "伺服器未設定 LINK_SIGNING_SECRET，無法產生連結" },
      { status: 503 }
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "格式錯誤" }, { status: 400 });
  }

  if (!checkStaffPassword(body?.password)) {
    return NextResponse.json({ error: "工作人員密碼錯誤" }, { status: 401 });
  }

  if (!body?.counts || typeof body.counts !== "object") {
    return NextResponse.json({ error: "缺少數量設定" }, { status: 400 });
  }

  return NextResponse.json({ token: createLimitsToken(body.counts) });
}
