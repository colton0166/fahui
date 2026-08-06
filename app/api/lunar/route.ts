import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

let lunarCache: Record<string, any> | null = null;

function loadLunarData() {
  if (lunarCache) return lunarCache;
  const filePath = path.join(
    process.cwd(),
    "lunar_data_1910_2100_立春切歲22.json"
  );
  const raw = fs.readFileSync(filePath, "utf-8");
  lunarCache = JSON.parse(raw);
  return lunarCache;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  if (!date) {
    return NextResponse.json({ error: "缺少 date 參數" }, { status: 400 });
  }

  try {
    const data = loadLunarData();
    const entry = data?.[date];

    if (!entry) {
      return NextResponse.json(
        { error: "找不到該日期的農曆資料" },
        { status: 404 }
      );
    }

    return NextResponse.json(entry);
  } catch (err) {
    return NextResponse.json(
      { error: "讀取農曆資料失敗" },
      { status: 500 }
    );
  }
}
