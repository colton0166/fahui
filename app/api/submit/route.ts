import { NextRequest, NextResponse } from "next/server";

const RAGIC_URL =
  "https://ap13.ragic.com/Xinfuge/supplement-treasury-data/80?api=true";

export async function POST(request: NextRequest) {
  const apiKey = process.env.RAGIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "未設定 RAGIC_API_KEY 環境變數" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();

    const ragicData: Record<string, any> = {
      "1003285": body.totalAmount || "",
      "1003286": body.name || "",
      "1003287": "No",
      "1003288": body.gender || "",
      "1003289": body.hasNickname || "",
      "1003290": body.country || "",
      "1003291": body.nickname || "",
      "1003292": body.city || "",
      "1003293": body.lunarYear || "",
      "1003294": body.district || "",
      "1003295": body.lunarMonth || "",
      "1003296": body.address || "",
      "1003297": body.lunarDay || "",
      "1003298": body.nicknameDisplay || "",
      "1003299": body.timeOfBirth || "",
      "1003300": body.residenceAddress || "",
      "1003301": body.address2 || "",
      "1003302": body.hasCompany || "",
      "1003303": body.wantsEmail || "",
      "1003304": body.companyName || "",
      "1003305": body.email || "",
      "1003306": body.companyAddress || "",
      "1003307": body.ganZhiYear || "",
      "1003308": body.age || "",
      "1003309": body.lunarAge || "",
      "1003310": body.lunarYearChinese || "",
      "1003311": body.companyAddressDisplay || "",
      "1003312": body.minguoYearShort || "",
    };

    // 嬰靈牌位子表格（負數 row ID）
    if (body.babySpiritEntries && body.babySpiritEntries.length > 0) {
      const subtable: Record<string, Record<string, string>> = {};
      body.babySpiritEntries.forEach(
        (entry: { name: string; address: string; recommenderName: string }, idx: number) => {
          subtable[String(-(idx + 1))] = {
            "1003346": entry.name || "",
            "1003347": entry.address || "",
            "1003388": entry.recommenderName || "",
          };
        }
      );
      ragicData["_subtable_1003350"] = subtable;
    }

    // 祖先牌位子表格（負數 row ID）
    if (body.ancestorEntries && body.ancestorEntries.length > 0) {
      const subtable: Record<string, Record<string, string>> = {};
      body.ancestorEntries.forEach(
        (entry: { name: string; address: string }, idx: number) => {
          subtable[String(-(idx + 1))] = {
            "1003348": entry.name || "",
            "1003349": entry.address || "",
          };
        }
      );
      ragicData["_subtable_1003351"] = subtable;
    }

    // 冤親債主牌位子表格（負數 row ID）
    if (body.karmicCreditorEntries && body.karmicCreditorEntries.length > 0) {
      const subtable: Record<string, Record<string, string>> = {};
      body.karmicCreditorEntries.forEach(
        (entry: { recommenderName: string; address: string }, idx: number) => {
          subtable[String(-(idx + 1))] = {
            "1003385": entry.recommenderName || "",
            "1003386": entry.address || "",
          };
        }
      );
      ragicData["_subtable_1003387"] = subtable;
    }

    console.log("[Ragic Submit] body:", JSON.stringify(ragicData, null, 2));

    const response = await fetch(RAGIC_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(apiKey + ":").toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(ragicData),
    });

    const result = await response.text();
    console.log("[Ragic Submit] status:", response.status, "response:", result);

    if (!response.ok) {
      return NextResponse.json(
        { error: "Ragic API 回傳錯誤", detail: result, status: response.status },
        { status: response.status }
      );
    }

    // Ragic 有時回傳 HTTP 200 但 body 含 ERROR
    try {
      const parsed = JSON.parse(result);
      if (parsed.status === "ERROR") {
        return NextResponse.json(
          { error: `Ragic 錯誤 (${parsed.code}): ${parsed.msg}`, detail: result },
          { status: 400 }
        );
      }
    } catch {
      // result 不是 JSON 就跳過
    }

    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    console.error("[Ragic Submit] error:", err);
    return NextResponse.json(
      { error: "提交失敗", detail: err.message },
      { status: 500 }
    );
  }
}
