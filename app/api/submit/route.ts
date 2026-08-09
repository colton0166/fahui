import { NextRequest, NextResponse } from "next/server";

const RAGIC_URL =
  "https://ap13.ragic.com/Xinfuge/supplement-treasury-data/90?api=true";

interface TabletEntry {
  scope?: string;
  yangName?: string;
  targetName?: string;
  address?: string;
}

// 各牌位子表格 → Ragic 子表格 key 與欄位編號對應
const SUBTABLE_MAP: Record<
  string,
  {
    subtableKey: string;
    fields: { scope?: string; yangName?: string; targetName?: string; address?: string };
  }
> = {
  quanjia: {
    subtableKey: "1003673",
    fields: { scope: "1003682", targetName: "1003657", address: "1003658" },
  },
  ancestor: {
    subtableKey: "1003674",
    fields: { yangName: "1003659", targetName: "1003660", address: "1003661" },
  },
  karmic: {
    subtableKey: "1003675",
    fields: { yangName: "1003662", address: "1003663" },
  },
  diji: {
    subtableKey: "1003712",
    fields: { yangName: "1003710", address: "1003711" },
  },
  unborn: {
    subtableKey: "1003676",
    fields: { yangName: "1003664", targetName: "1003665", address: "1003666" },
  },
  friends: {
    subtableKey: "1003677",
    fields: { yangName: "1003667", targetName: "1003668", address: "1003669" },
  },
  pets: {
    subtableKey: "1003678",
    fields: { yangName: "1003670", targetName: "1003671", address: "1003672" },
  },
};

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
      "1003651": body.name || "",
      "1003683": body.gender || "",
      "1003652": body.lunarBirth || "",
      "1003653": body.residenceAddress || "",
      "1003654": body.address2 || "",
      "1003656": body.participationCount || "",
      "1003679": body.companyName || "",
      "1003680": body.companyAddress || "",
      "1003681": body.timeOfBirth || "",
    };

    // 各牌位子表格（負數 row ID）
    const tablets: Record<string, TabletEntry[]> = body.tablets || {};
    Object.entries(SUBTABLE_MAP).forEach(([key, map]) => {
      const entries = tablets[key];
      if (!entries || entries.length === 0) return;

      const subtable: Record<string, Record<string, string>> = {};
      entries.forEach((entry, idx) => {
        const row: Record<string, string> = {};
        if (map.fields.scope) row[map.fields.scope] = entry.scope || "";
        if (map.fields.yangName)
          row[map.fields.yangName] = entry.yangName || "";
        if (map.fields.targetName)
          row[map.fields.targetName] = entry.targetName || "";
        if (map.fields.address)
          row[map.fields.address] = entry.address || "";
        subtable[String(-(idx + 1))] = row;
      });
      ragicData[`_subtable_${map.subtableKey}`] = subtable;
    });

    // 此表單以 APIKey query 參數認證（Basic auth 會被視為 guest 而回傳 106）
    const submitUrl = `${RAGIC_URL}&APIKey=${encodeURIComponent(apiKey)}`;
    const response = await fetch(submitUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(ragicData),
    });

    const result = await response.text();

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
