"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { cities, districts } from "@/lib/locationData";

interface LunarData {
  lunar_year: string;
  lunar_month: string;
  lunar_day: string;
  lunar_solar_year: number;
  zodiac: string;
  gan_zhi_year: string;
  is_after_lichun: boolean;
}

const COUNT_OPTIONS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
const INVALID_SPIRIT_NAMES = ["沒有", "無", "沒", "不知道", "不知", "未知", "N/A", "na", "none", "null", "不清楚"];

const YES_NO = ["是", "否"];
const TIME_OPTIONS = [
  "子", "丑", "寅", "卯", "辰", "巳",
  "午", "未", "申", "酉", "戌", "亥", "吉",
];

// 金額規則：參加份數 1 份 = 1200，依此類推；每組牌位 +500
const PRICE_PER_SHARE = 1200;
const PRICE_PER_TABLET = 500;

// ── 牌位子表格設定 ──────────────────────────────────────────
type EntryKey = "scope" | "yangName" | "targetName" | "address";

interface TabletFieldConfig {
  key: EntryKey;
  fieldId: string;
  label: string;
  required: boolean;
  options?: string[]; // 有值時渲染為單選下拉，否則為文字輸入
  isAddress?: boolean; // 顯示「與居住地址相同」勾選框
  sameAsMainName?: boolean; // 顯示「與基本資料姓名相同」勾選框
  allowBlankName?: boolean; // 允許留白（僅檢查無效字詞）
  hint?: React.ReactNode;
  placeholder?: string;
}

interface TabletConfig {
  key: string;
  title: string;
  subtableKey: string;
  fields: TabletFieldConfig[];
}

const TABLET_CONFIGS: TabletConfig[] = [
  {
    key: "quanjia",
    title: "全家/個人消災長生祿位",
    subtableKey: "1003673",
    fields: [
      {
        key: "scope",
        fieldId: "1003682",
        label: "全家/個人",
        required: true,
        options: ["全家", "個人"],
      },
      {
        key: "targetName",
        fieldId: "1003657",
        label: "全家消災長生祿位（姓名）",
        required: true,
        sameAsMainName: true,
        placeholder: "請輸入姓名",
      },
      {
        key: "address",
        fieldId: "1003658",
        label: "地址",
        required: true,
        isAddress: true,
        placeholder: "請輸入地址",
      },
    ],
  },
  {
    key: "ancestor",
    title: "超薦祖先牌位",
    subtableKey: "1003674",
    fields: [
      {
        key: "yangName",
        fieldId: "1003659",
        label: "陽上超薦人",
        required: true,
        sameAsMainName: true,
        placeholder: "請輸入陽上超薦人姓名",
      },
      {
        key: "targetName",
        fieldId: "1003660",
        label: "超薦祖先姓氏或姓名",
        required: true,
        placeholder: "例：黃 或 黃OO",
        hint: (
          <>
            • 報名「歷代祖先」請填寫 <span className="font-bold text-red-700">姓氏</span>
            <br />
            • 報名「指定祖先」請填寫 <span className="font-bold text-red-700">祖先姓名</span>
          </>
        ),
      },
      {
        key: "address",
        fieldId: "1003661",
        label: "地址",
        required: true,
        isAddress: true,
        placeholder: "請輸入牌位地址",
      },
    ],
  },
  {
    key: "karmic",
    title: "冤親債主牌位",
    subtableKey: "1003675",
    fields: [
      {
        key: "yangName",
        fieldId: "1003662",
        label: "陽上姓名",
        required: true,
        sameAsMainName: true,
        placeholder: "請輸入陽上姓名",
      },
      {
        key: "address",
        fieldId: "1003663",
        label: "地址",
        required: true,
        isAddress: true,
        placeholder: "請輸入居住地址",
      },
    ],
  },
  {
    key: "unborn",
    title: "超薦無緣子女（嬰靈）牌位",
    subtableKey: "1003676",
    fields: [
      {
        key: "yangName",
        fieldId: "1003664",
        label: "陽上超薦人姓名",
        required: true,
        sameAsMainName: true,
        placeholder: "請輸入陽上超薦人姓名",
      },
      {
        key: "targetName",
        fieldId: "1003665",
        label: "無緣子女姓名",
        required: false,
        allowBlankName: true,
        placeholder: "請輸入無緣子女姓名（可留白）",
        hint: "不可填寫「沒有」等無效內容",
      },
      {
        key: "address",
        fieldId: "1003666",
        label: "地址",
        required: true,
        isAddress: true,
        placeholder: "請輸入地址",
      },
    ],
  },
  {
    key: "friends",
    title: "超渡親朋好友牌位",
    subtableKey: "1003677",
    fields: [
      {
        key: "yangName",
        fieldId: "1003667",
        label: "陽上超薦人姓名",
        required: true,
        sameAsMainName: true,
        placeholder: "請輸入陽上超薦人姓名",
      },
      {
        key: "targetName",
        fieldId: "1003668",
        label: "超渡親朋好友姓名",
        required: true,
        placeholder: "請輸入親朋好友姓名",
      },
      {
        key: "address",
        fieldId: "1003669",
        label: "地址",
        required: true,
        isAddress: true,
        placeholder: "請輸入地址",
      },
    ],
  },
  {
    key: "pets",
    title: "超薦寵物牌位",
    subtableKey: "1003678",
    fields: [
      {
        key: "yangName",
        fieldId: "1003670",
        label: "陽上超薦人姓名",
        required: true,
        sameAsMainName: true,
        placeholder: "請輸入陽上超薦人姓名",
      },
      {
        key: "targetName",
        fieldId: "1003671",
        label: "超薦寵物及姓名",
        required: true,
        placeholder: "請輸入寵物種類及姓名",
      },
      {
        key: "address",
        fieldId: "1003672",
        label: "地址",
        required: true,
        isAddress: true,
        placeholder: "請輸入地址",
      },
    ],
  },
];

interface TabletEntry {
  scope: string;
  yangName: string;
  targetName: string;
  address: string;
  sameAsResidence: boolean;
  sameAsMainName: boolean;
}

interface TabletState {
  wants: string;
  count: string;
  entries: TabletEntry[];
}

function emptyEntry(): TabletEntry {
  return {
    scope: "",
    yangName: "",
    targetName: "",
    address: "",
    sameAsResidence: false,
    sameAsMainName: false,
  };
}

// 民國年轉中文：未滿百用位值（90→九十、38→三十八），滿百以上逐位（112→一一二、100→一〇〇）
function minguoYearToChinese(num: number): string {
  const digits = ["〇", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
  if (num >= 100) {
    return String(num)
      .split("")
      .map((c) => digits[Number(c)] ?? c)
      .join("");
  }
  if (num < 10) return digits[num];
  const tens = Math.floor(num / 10);
  const ones = num % 10;
  const tensStr = tens === 1 ? "十" : `${digits[tens]}十`;
  return ones ? `${tensStr}${digits[ones]}` : tensStr;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function SelectField({
  label,
  value,
  onChange,
  options,
  required,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-red-500 focus:ring-2 focus:ring-red-200 focus:outline-none disabled:bg-gray-100 disabled:text-gray-500 transition"
      >
        <option value="">{placeholder || "請選擇"}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  required,
  placeholder,
  readOnly,
  type,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  required?: boolean;
  placeholder?: string;
  readOnly?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type || "text"}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        readOnly={readOnly}
        placeholder={placeholder}
        className={`w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-red-500 focus:ring-2 focus:ring-red-200 focus:outline-none transition ${
          readOnly ? "bg-gray-50 text-gray-600 cursor-default" : "bg-white"
        }`}
      />
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-500 mb-1">
        {label}
      </label>
      <div className="w-full rounded-lg border border-gray-200 bg-red-50/50 px-3 py-2.5 text-sm text-gray-700 min-h-[40px]">
        {value || "-"}
      </div>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4 mt-2">
      <div className="h-px flex-1 bg-gradient-to-r from-amber-400 to-transparent" />
      <h2 className="text-lg font-bold text-red-800 whitespace-nowrap">
        {title}
      </h2>
      <div className="h-px flex-1 bg-gradient-to-l from-amber-400 to-transparent" />
    </div>
  );
}

export default function FormPage() {
  const router = useRouter();
  const [name, setName] = useState("");

  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [address, setAddress] = useState("");
  const [address2, setAddress2] = useState("");

  const [birthYear, setBirthYear] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay, setBirthDay] = useState("");

  const [lunarData, setLunarData] = useState<LunarData | null>(null);
  const [lunarLoading, setLunarLoading] = useState(false);
  const [lunarYear, setLunarYear] = useState("");
  const [lunarMonth, setLunarMonth] = useState("");
  const [lunarDay, setLunarDay] = useState("");

  const [timeOfBirth, setTimeOfBirth] = useState("");

  const [participationCount, setParticipationCount] = useState("1");

  const [hasCompany, setHasCompany] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");

  const [tablets, setTablets] = useState<Record<string, TabletState>>(() =>
    Object.fromEntries(
      TABLET_CONFIGS.map((c) => [c.key, { wants: "", count: "", entries: [] }])
    )
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const [errors, setErrors] = useState<string[]>([]);

  // Year options: 1912 ~ 2026
  const yearOptions = useMemo(() => {
    const arr: string[] = [];
    for (let y = 2026; y >= 1912; y--) arr.push(String(y));
    return arr;
  }, []);

  const monthOptions = useMemo(
    () => Array.from({ length: 12 }, (_, i) => String(i + 1)),
    []
  );

  const dayOptions = useMemo(() => {
    const y = birthYear ? parseInt(birthYear) : 2000;
    const m = birthMonth ? parseInt(birthMonth) : 1;
    const days = getDaysInMonth(y, m);
    return Array.from({ length: days }, (_, i) => String(i + 1));
  }, [birthYear, birthMonth]);

  // Lunar lookup
  useEffect(() => {
    if (!birthYear || !birthMonth || !birthDay) {
      setLunarData(null);
      setLunarYear("");
      setLunarMonth("");
      setLunarDay("");
      return;
    }

    const dateStr = `${birthYear}-${birthMonth.padStart(2, "0")}-${birthDay.padStart(2, "0")}`;
    setLunarLoading(true);

    fetch(`/api/lunar?date=${dateStr}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setLunarData(null);
          setLunarYear("");
          setLunarMonth("");
          setLunarDay("");
          return;
        }
        setLunarData(data);
        const minguoYear = data.lunar_solar_year - 1911;
        if (minguoYear >= 1 && minguoYear <= 115) {
          const padded = String(minguoYear).padStart(3, "0");
          setLunarYear(`${padded} (西元${data.lunar_solar_year})`);
        } else {
          setLunarYear("");
        }
        setLunarMonth(data.lunar_month.replace("閏", "潤"));
        setLunarDay(data.lunar_day);
      })
      .catch(() => {
        setLunarData(null);
        setLunarYear("");
        setLunarMonth("");
        setLunarDay("");
      })
      .finally(() => setLunarLoading(false));
  }, [birthYear, birthMonth, birthDay]);

  // Reset cascading fields
  useEffect(() => {
    setCity("");
    setDistrict("");
  }, [country]);

  useEffect(() => {
    setDistrict("");
  }, [city]);

  useEffect(() => {
    if (hasCompany === "否") {
      setCompanyName("");
      setCompanyAddress("");
    }
  }, [hasCompany]);

  // Adjust day if exceeds max
  useEffect(() => {
    if (birthDay && dayOptions.length > 0) {
      const maxDay = dayOptions.length;
      if (parseInt(birthDay) > maxDay) {
        setBirthDay(String(maxDay));
      }
    }
  }, [dayOptions, birthDay]);

  // Computed
  const residenceAddress = `${city}${district}${address}`;
  const zodiacDisplay = lunarData?.zodiac || "";
  const ganZhiDisplay = lunarData?.gan_zhi_year || "";
  const lunarYearChineseDisplay = lunarData?.lunar_year || "";

  // 農曆出生年月日（組合成文字送入 Ragic 1003652），例：一一二年十二月廿二日
  const minguoYear = lunarData ? lunarData.lunar_solar_year - 1911 : 0;
  const lunarBirth =
    lunarData && minguoYear > 0
      ? `${minguoYearToChinese(minguoYear)}年${lunarMonth}月${lunarDay}日`
      : "";

  const shares = parseInt(participationCount) || 0;
  const totalTabletRows = TABLET_CONFIGS.reduce((sum, c) => {
    const t = tablets[c.key];
    return sum + (t.wants === "是" ? t.entries.length : 0);
  }, 0);
  const shareAmount = shares * PRICE_PER_SHARE;
  const tabletAmount = totalTabletRows * PRICE_PER_TABLET;
  const totalAmount = shareAmount + tabletAmount;

  // ── 牌位 state 更新 helpers ──────────────────────────────
  function setTabletWants(key: string, wants: string) {
    setTablets((prev) => {
      const next = { ...prev };
      if (wants === "否") {
        next[key] = { wants, count: "", entries: [] };
      } else {
        next[key] = { ...prev[key], wants };
      }
      return next;
    });
  }

  function setTabletCount(key: string, count: string) {
    setTablets((prev) => {
      const n = parseInt(count) || 0;
      const prevEntries = prev[key].entries;
      const entries: TabletEntry[] = [];
      for (let i = 0; i < n; i++) entries.push(prevEntries[i] || emptyEntry());
      return { ...prev, [key]: { ...prev[key], count, entries } };
    });
  }

  function updateEntry(key: string, idx: number, patch: Partial<TabletEntry>) {
    setTablets((prev) => {
      const entries = prev[key].entries.map((e, i) =>
        i === idx ? { ...e, ...patch } : e
      );
      return { ...prev, [key]: { ...prev[key], entries } };
    });
  }

  function validate(): string[] {
    const errs: string[] = [];
    if (!name.trim()) errs.push("請輸入姓名");
    if (!country) errs.push("請選擇國家");
    if (!birthYear || !birthMonth || !birthDay)
      errs.push("請選擇完整的國曆出生日期");
    if (!lunarYear) errs.push("無法取得農曆資料，請確認出生日期");
    if (!timeOfBirth) errs.push("請選擇時辰");
    if (country === "臺灣" && !address.trim()) errs.push("請輸入地址");
    if (!participationCount) errs.push("請選擇參加份數");
    if (!hasCompany) errs.push("請選擇是否有公司行號");
    if (hasCompany === "是") {
      if (!companyName.trim()) errs.push("請輸入公司名稱");
      if (!companyAddress.trim()) errs.push("請輸入公司地址");
    }

    TABLET_CONFIGS.forEach((cfg) => {
      const t = tablets[cfg.key];
      if (t.wants !== "是") return;
      if (!t.count) errs.push(`請選擇${cfg.title}數量`);
      t.entries.forEach((entry, i) => {
        cfg.fields.forEach((f) => {
          const val = entry[f.key].trim();
          if (f.allowBlankName) {
            if (
              val &&
              INVALID_SPIRIT_NAMES.some(
                (inv) => inv.toLowerCase() === val.toLowerCase()
              )
            ) {
              errs.push(`${cfg.title}第 ${i + 1} 筆：${f.label}不可填寫「${val}」`);
            }
          } else if (f.required && !val) {
            const verb = f.options ? "請選擇" : "請輸入";
            errs.push(`${cfg.title}第 ${i + 1} 筆：${verb}${f.label}`);
          } else if (
            f.key !== "address" &&
            val &&
            INVALID_SPIRIT_NAMES.some(
              (inv) => inv.toLowerCase() === val.toLowerCase()
            )
          ) {
            errs.push(`${cfg.title}第 ${i + 1} 筆：${f.label}不可填寫「${val}」`);
          }
        });
      });
    });
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitResult(null);

    const validationErrors = validate();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setErrors([]);

    // 組合各牌位子表格資料
    const tabletPayload: Record<string, TabletEntry[]> = {};
    TABLET_CONFIGS.forEach((cfg) => {
      const t = tablets[cfg.key];
      tabletPayload[cfg.key] = t.wants === "是" ? t.entries : [];
    });

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          lunarBirth,
          timeOfBirth,
          residenceAddress,
          address2,
          participationCount,
          companyName: hasCompany === "是" ? companyName : "",
          companyAddress: hasCompany === "是" ? companyAddress : "",
          tablets: tabletPayload,
        }),
      });

      const result = await res.json();

      if (result.success) {
        router.push("/thank-you");
      } else {
        const detail = result.detail ? `\n${result.detail}` : "";
        setSubmitResult({
          success: false,
          message: `${result.error || "提交失敗，請稍後再試"}${detail}`,
        });
      }
    } catch {
      setSubmitResult({ success: false, message: "網路錯誤，請稍後再試" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block bg-gradient-to-b from-red-700 via-red-800 to-red-900 text-amber-100 px-10 py-5 rounded-2xl shadow-xl border-2 border-amber-400">
            <p className="text-amber-300 text-sm tracking-[0.5em] mb-1">
              盂蘭盆會
            </p>
            <h1 className="text-2xl md:text-3xl font-bold tracking-wide text-amber-200 drop-shadow">
              中元普渡報名表
            </h1>
            <p className="text-amber-100/80 text-sm mt-2 tracking-widest">
              普渡十方・慎終追遠
            </p>
          </div>

          {/* 活動海報 */}
          <div className="mt-6">
            <img
              src="/poster.jpg"
              alt="慶讚中元 中元普渡祈福海報"
              className="mx-auto w-full max-w-md rounded-2xl shadow-xl border-2 border-amber-400"
            />
          </div>
        </div>

        {/* Error messages */}
        {errors.length > 0 && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="font-semibold text-red-700 mb-2">請修正以下問題：</p>
            <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
              {errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Success / Error result */}
        {submitResult && (
          <div
            className={`mb-6 border rounded-xl p-4 ${
              submitResult.success
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            <p className="font-semibold">{submitResult.message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* ===== 基本資料 ===== */}
          <div className="bg-white rounded-2xl shadow-md p-6 mb-6 border-t-4 border-amber-400">
            <SectionTitle title="基本資料" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                label="姓名"
                value={name}
                onChange={setName}
                required
                placeholder="請輸入姓名"
              />
              <SelectField
                label="參加份數"
                value={participationCount}
                onChange={setParticipationCount}
                options={COUNT_OPTIONS}
                required
              />
            </div>
          </div>

          {/* ===== 出生資料 ===== */}
          <div className="bg-white rounded-2xl shadow-md p-6 mb-6 border-t-4 border-amber-400">
            <SectionTitle title="出生資料" />

            <div className="bg-red-50 border border-red-300 rounded-xl p-4 mb-5 text-center">
              <p className="text-xl md:text-2xl font-bold text-red-600">
                ❗ 請填寫「國曆生日」
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                國曆出生日期
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <select
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-red-500 focus:ring-2 focus:ring-red-200 focus:outline-none transition"
                  >
                    <option value="">西元年</option>
                    {yearOptions.map((y) => (
                      <option key={y} value={y}>
                        {y} (民國{parseInt(y) - 1911})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <select
                    value={birthMonth}
                    onChange={(e) => setBirthMonth(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-red-500 focus:ring-2 focus:ring-red-200 focus:outline-none transition"
                  >
                    <option value="">月</option>
                    {monthOptions.map((m) => (
                      <option key={m} value={m}>
                        {m} 月
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <select
                    value={birthDay}
                    onChange={(e) => setBirthDay(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-red-500 focus:ring-2 focus:ring-red-200 focus:outline-none transition"
                  >
                    <option value="">日</option>
                    {dayOptions.map((d) => (
                      <option key={d} value={d}>
                        {d} 日
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {lunarLoading && (
              <div className="text-sm text-red-700 mb-3 flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                正在轉換農曆...
              </div>
            )}

            {lunarData && (
              <div className="bg-red-50 rounded-xl border border-red-200 p-4">
                <p className="text-sm font-semibold text-red-800 mb-3">
                  農曆轉換結果
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <ReadOnlyField label="西元民國年" value={lunarYear} />
                  <ReadOnlyField label="農曆出生月" value={lunarMonth} />
                  <ReadOnlyField label="農曆出生日" value={lunarDay} />
                  <ReadOnlyField label="生肖" value={zodiacDisplay} />
                  <ReadOnlyField label="歲次" value={ganZhiDisplay} />
                  <ReadOnlyField label="農曆年國字" value={lunarYearChineseDisplay} />
                </div>
                <div className="mt-3">
                  <ReadOnlyField label="農曆出生年月日（送出內容）" value={lunarBirth} />
                </div>
              </div>
            )}

            <div className="mt-4">
              <SelectField
                label="時辰"
                value={timeOfBirth}
                onChange={setTimeOfBirth}
                options={TIME_OPTIONS}
                required
              />
            </div>
          </div>

          {/* ===== 地址資料 ===== */}
          <div className="bg-white rounded-2xl shadow-md p-6 mb-6 border-t-4 border-amber-400">
            <SectionTitle title="地址資料" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField
                label="請選擇國家"
                value={country}
                onChange={setCountry}
                options={["臺灣", "其他"]}
                required
              />
              <div>{/* spacer */}</div>

              {country === "臺灣" && (
                <>
                  <SelectField
                    label="行政區"
                    value={city}
                    onChange={setCity}
                    options={cities}
                  />
                  <SelectField
                    label="鄉鎮區"
                    value={district}
                    onChange={setDistrict}
                    options={city ? districts[city] || [] : []}
                    disabled={!city}
                  />
                </>
              )}

              <TextField
                label="地址"
                value={address}
                onChange={setAddress}
                required={country === "臺灣"}
                placeholder="請輸入詳細地址"
              />
              <TextField
                label="地址2（選填）"
                value={address2}
                onChange={setAddress2}
                placeholder="地址補充資訊"
              />
            </div>

            {(city || district || address) && (
              <div className="mt-4">
                <ReadOnlyField label="居住地址（自動組合）" value={residenceAddress} />
              </div>
            )}
          </div>

          {/* ===== 公司資料 ===== */}
          <div className="bg-white rounded-2xl shadow-md p-6 mb-6 border-t-4 border-amber-400">
            <SectionTitle title="公司資料" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField
                label="請問是否有公司行號？"
                value={hasCompany}
                onChange={setHasCompany}
                options={YES_NO}
                required
              />
              <div>{/* spacer */}</div>

              {hasCompany === "是" && (
                <>
                  <TextField
                    label="公司名稱"
                    value={companyName}
                    onChange={setCompanyName}
                    placeholder="請輸入公司名稱"
                    required
                  />
                  <TextField
                    label="公司地址"
                    value={companyAddress}
                    onChange={setCompanyAddress}
                    placeholder="請輸入公司地址"
                    required
                  />
                </>
              )}
            </div>
          </div>

          {/* ===== 各項牌位 ===== */}
          {TABLET_CONFIGS.map((cfg) => {
            const t = tablets[cfg.key];
            // 取本牌位唯一的說明文字，供無說明的欄位保留等高空間以對齊輸入框
            const hintPlaceholder = cfg.fields.find((f) => f.hint)?.hint;
            return (
              <div key={cfg.key} className="bg-white rounded-2xl shadow-md p-6 mb-6 border-t-4 border-amber-400">
                <SectionTitle title={cfg.title} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SelectField
                    label={`是否要參加${cfg.title}？`}
                    value={t.wants}
                    onChange={(v) => setTabletWants(cfg.key, v)}
                    options={YES_NO}
                    required
                  />
                  {t.wants === "是" && (
                    <SelectField
                      label="請選擇數量"
                      value={t.count}
                      onChange={(v) => setTabletCount(cfg.key, v)}
                      options={COUNT_OPTIONS}
                      required
                    />
                  )}
                </div>

                {t.wants === "是" && t.entries.length > 0 && (
                  <div className="mt-6 space-y-4">
                    {t.entries.map((entry, idx) => (
                      <div
                        key={idx}
                        className="border border-red-200 rounded-xl p-4 bg-red-50/30"
                      >
                        <p className="text-sm font-bold text-red-800 mb-3">
                          第 {idx + 1} 筆
                        </p>
                        <div
                          className={`grid grid-cols-1 gap-4 ${
                            cfg.fields.length >= 3
                              ? "md:grid-cols-3"
                              : "md:grid-cols-2"
                          }`}
                        >
                          {cfg.fields.map((f) => (
                            <div key={f.fieldId}>
                              <label className="block text-sm font-semibold text-gray-700 mb-1">
                                {f.label}
                                {f.required && (
                                  <span className="text-red-500 ml-1">*</span>
                                )}
                              </label>
                              {f.hint ? (
                                <p className="text-xs text-gray-500 mb-2 leading-relaxed">
                                  {f.hint}
                                </p>
                              ) : hintPlaceholder ? (
                                <p
                                  className="text-xs mb-2 leading-relaxed select-none invisible"
                                  aria-hidden="true"
                                >
                                  {hintPlaceholder}
                                </p>
                              ) : null}
                              {f.options ? (
                                <select
                                  value={entry[f.key]}
                                  onChange={(e) =>
                                    updateEntry(cfg.key, idx, {
                                      [f.key]: e.target.value,
                                    })
                                  }
                                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-red-500 focus:ring-2 focus:ring-red-200 focus:outline-none transition"
                                >
                                  <option value="">請選擇</option>
                                  {f.options.map((opt) => (
                                    <option key={opt} value={opt}>
                                      {opt}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  value={entry[f.key]}
                                  onChange={(e) => {
                                    const patch: Partial<TabletEntry> = {
                                      [f.key]: e.target.value,
                                    };
                                    if (f.isAddress)
                                      patch.sameAsResidence = false;
                                    if (f.sameAsMainName)
                                      patch.sameAsMainName = false;
                                    updateEntry(cfg.key, idx, patch);
                                  }}
                                  placeholder={f.placeholder}
                                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-red-500 focus:ring-2 focus:ring-red-200 focus:outline-none transition"
                                />
                              )}
                              {f.isAddress && (
                                <label className="inline-flex items-center gap-2 mt-2 cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={entry.sameAsResidence}
                                    onChange={(e) =>
                                      updateEntry(cfg.key, idx, {
                                        sameAsResidence: e.target.checked,
                                        address: e.target.checked
                                          ? residenceAddress
                                          : "",
                                      })
                                    }
                                    className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-400"
                                  />
                                  <span className="text-sm text-gray-600">
                                    與居住地址相同
                                  </span>
                                </label>
                              )}
                              {f.sameAsMainName && (
                                <label className="inline-flex items-center gap-2 mt-2 cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={entry.sameAsMainName}
                                    onChange={(e) =>
                                      updateEntry(cfg.key, idx, {
                                        sameAsMainName: e.target.checked,
                                        [f.key]: e.target.checked ? name : "",
                                      })
                                    }
                                    className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-400"
                                  />
                                  <span className="text-sm text-gray-600">
                                    與基本資料姓名相同
                                  </span>
                                </label>
                              )}
                              {!f.isAddress && !f.sameAsMainName && (
                                <label
                                  className="inline-flex items-center gap-2 mt-2 select-none invisible"
                                  aria-hidden="true"
                                >
                                  <input
                                    type="checkbox"
                                    readOnly
                                    className="h-4 w-4 rounded border-gray-300"
                                  />
                                  <span className="text-sm text-gray-600">佔位</span>
                                </label>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* ===== 法會金額 ===== */}
          <div className="bg-white rounded-2xl shadow-md p-6 mb-6 border-t-4 border-amber-400">
            <SectionTitle title="法會金額" />
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700 space-y-1">
                  <p>
                    參加份數 ×{shares || 0}：NT$ {shareAmount.toLocaleString()}
                  </p>
                  {totalTabletRows > 0 && (
                    <p>
                      牌位 ×{totalTabletRows}（每組 NT$ {PRICE_PER_TABLET}）：NT${" "}
                      {tabletAmount.toLocaleString()}
                    </p>
                  )}
                  {TABLET_CONFIGS.map((cfg) => {
                    const t = tablets[cfg.key];
                    const n = t.wants === "是" ? t.entries.length : 0;
                    if (n === 0) return null;
                    return (
                      <p key={cfg.key} className="text-xs text-gray-500 ml-2">
                        └ {cfg.title} ×{n}
                      </p>
                    );
                  })}
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-1">應付總額</p>
                  <p className="text-2xl font-bold text-red-700">
                    NT$ {totalAmount.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="text-center">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 text-amber-200 font-bold py-3 px-10 rounded-xl shadow-lg hover:shadow-xl ring-1 ring-amber-400/60 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  提交中...
                </>
              ) : (
                "提交資料"
              )}
            </button>
          </div>

          <p className="text-center text-xs text-gray-400 mt-4 mb-8">
            提交後資料將自動回傳至系統
          </p>
        </form>
      </div>
    </div>
  );
}
