"use client";

import { useEffect, useMemo, useState } from "react";
import { MAX_TABLET_LIMIT, TABLET_CONFIGS } from "@/lib/tablets";

// 工作人員專用：確認匯款後，依客人購買的牌位數量產生專屬報名連結。
// 牌位種類與網址參數名稱皆取自 lib/tablets.ts，新增牌位時這頁會自動跟著更新。

function Stepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  function clamp(n: number) {
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(MAX_TABLET_LIMIT, Math.floor(n)));
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(clamp(value - 1))}
        disabled={value <= 0}
        className="h-10 w-10 shrink-0 rounded-lg border border-gray-300 bg-white text-lg font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
        aria-label="減少"
      >
        −
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        max={MAX_TABLET_LIMIT}
        value={value}
        onChange={(e) => onChange(clamp(Number(e.target.value)))}
        className="h-10 w-20 rounded-lg border border-gray-300 bg-white text-center text-sm font-semibold shadow-sm focus:border-red-500 focus:ring-2 focus:ring-red-200 focus:outline-none transition"
      />
      <button
        type="button"
        onClick={() => onChange(clamp(value + 1))}
        disabled={value >= MAX_TABLET_LIMIT}
        className="h-10 w-10 shrink-0 rounded-lg border border-gray-300 bg-white text-lg font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
        aria-label="增加"
      >
        ＋
      </button>
    </div>
  );
}

export default function StaffLinkBuilderPage() {
  const [counts, setCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(TABLET_CONFIGS.map((c) => [c.key, 0]))
  );
  const [baseUrl, setBaseUrl] = useState("");
  const [copied, setCopied] = useState(false);

  // 預設用目前網站網址，工作人員仍可自行改成正式網域
  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);

  const selected = TABLET_CONFIGS.filter((cfg) => counts[cfg.key] > 0);
  const hasAny = selected.length > 0;

  const query = useMemo(
    () =>
      selected.map((cfg) => `${cfg.limitParam}=${counts[cfg.key]}`).join("&"),
    [selected, counts]
  );

  const link = hasAny ? `${baseUrl}/?${query}` : "";

  // 網址一變更就把「已複製」提示收回，避免誤以為複製到新網址
  useEffect(() => {
    setCopied(false);
  }, [link]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      // 非 https 或瀏覽器不支援時，退回手動選取
      const el = document.getElementById("link-output") as HTMLInputElement | null;
      el?.select();
    }
  }

  function reset() {
    setCounts(Object.fromEntries(TABLET_CONFIGS.map((c) => [c.key, 0])));
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* 標題 */}
        <div className="text-center mb-8">
          <div className="inline-block bg-gradient-to-b from-red-700 via-red-800 to-red-900 text-amber-100 px-10 py-5 rounded-2xl shadow-xl border-2 border-amber-400">
            <p className="text-amber-300 text-sm tracking-[0.4em] mb-1">
              工作人員專用
            </p>
            <h1 className="text-2xl md:text-3xl font-bold tracking-wide text-amber-200 drop-shadow">
              報名連結產生器
            </h1>
            <p className="text-amber-100/80 text-sm mt-2 tracking-wide">
              確認匯款後，依客人購買的牌位數量產生專屬連結
            </p>
          </div>
        </div>

        {/* 數量設定 */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6 border-t-4 border-amber-400">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-bold text-red-800">各牌位可填數量</h2>
            <button
              type="button"
              onClick={reset}
              className="text-sm text-gray-500 underline underline-offset-2 hover:text-gray-700"
            >
              全部歸零
            </button>
          </div>

          <div className="space-y-3">
            {TABLET_CONFIGS.map((cfg) => (
              <div
                key={cfg.key}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800">
                    {cfg.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    參數 {cfg.limitParam}
                  </p>
                </div>
                <Stepper
                  value={counts[cfg.key]}
                  onChange={(v) =>
                    setCounts((prev) => ({ ...prev, [cfg.key]: v }))
                  }
                />
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-500 mt-4 leading-relaxed">
            數量為 0 的牌位，客人開啟連結後會看到該區塊停用並標示「本次未登記此牌位」，無法填寫。
          </p>
        </div>

        {/* 產生的連結 */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6 border-t-4 border-amber-400">
          <h2 className="text-lg font-bold text-red-800 mb-4">傳給客人的連結</h2>

          <label className="block text-sm font-semibold text-gray-700 mb-1">
            網站網址
          </label>
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value.replace(/\/+$/, ""))}
            placeholder="https://fahui.xinfuge.com"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-red-500 focus:ring-2 focus:ring-red-200 focus:outline-none transition mb-4"
          />

          {hasAny ? (
            <>
              <input
                id="link-output"
                type="text"
                readOnly
                value={link}
                onFocus={(e) => e.currentTarget.select()}
                className="w-full rounded-lg border border-red-200 bg-red-50/50 px-3 py-2.5 text-sm text-gray-800 shadow-sm focus:outline-none"
              />
              <div className="flex flex-wrap gap-3 mt-3">
                <button
                  type="button"
                  onClick={copyLink}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 text-amber-200 font-bold py-2.5 px-6 ring-1 ring-amber-400/60 transition"
                >
                  {copied ? "已複製 ✓" : "複製連結"}
                </button>
                <a
                  href={link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white text-gray-700 font-semibold py-2.5 px-6 hover:bg-gray-100 transition"
                >
                  開啟預覽
                </a>
              </div>
            </>
          ) : (
            <div className="rounded-xl bg-amber-50 border border-amber-300 p-4 text-sm text-amber-900 leading-relaxed">
              目前所有牌位數量都是 0，尚未產生連結。
              <br />
              請至少設定一項牌位數量——若傳出沒有參數的網址，客人會看到不受限制的原始表單。
            </div>
          )}
        </div>

        {/* 客人看到的內容 */}
        {hasAny && (
          <div className="bg-white rounded-2xl shadow-md p-6 mb-6 border-t-4 border-amber-400">
            <h2 className="text-lg font-bold text-red-800 mb-4">
              客人開啟後會看到
            </h2>
            <div className="space-y-2">
              {TABLET_CONFIGS.map((cfg) => {
                const n = counts[cfg.key];
                return (
                  <div
                    key={cfg.key}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span
                      className={n > 0 ? "text-gray-800" : "text-gray-400"}
                    >
                      {cfg.title}
                    </span>
                    <span
                      className={
                        n > 0
                          ? "font-semibold text-red-700 whitespace-nowrap"
                          : "text-gray-400 whitespace-nowrap"
                      }
                    >
                      {n > 0 ? `0 / ${n}` : "本次未登記"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mb-8 leading-relaxed">
          此頁僅供內部使用，數量限制為前端防呆，並非付款驗證機制。
        </p>
      </div>
    </div>
  );
}
