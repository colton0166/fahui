"use client";

import { useState, useEffect, useMemo, useRef } from "react";
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
const GENDER_OPTIONS = ["信士", "信女"];
// 時辰：value 為送出值，label 為畫面顯示（子時分夜子時／早子時）
const TIME_OPTIONS: { value: string; label: string }[] = [
  { value: "早子", label: "早子時（0-1）" },
  { value: "丑", label: "丑" },
  { value: "寅", label: "寅" },
  { value: "卯", label: "卯" },
  { value: "辰", label: "辰" },
  { value: "巳", label: "巳" },
  { value: "午", label: "午" },
  { value: "未", label: "未" },
  { value: "申", label: "申" },
  { value: "酉", label: "酉" },
  { value: "戌", label: "戌" },
  { value: "亥", label: "亥" },
  { value: "夜子", label: "夜子時（23-0）" },
  { value: "吉", label: "吉" },
];

// 金額規則：參加份數 1 份 = 1200，依此類推；每組牌位 +500
const PRICE_PER_SHARE = 1200;
const PRICE_PER_TABLET = 500; // 一般加購牌位每份
const PRICE_FAMILY = 1000; // 全戶消災每份
const PRICE_PERSONAL = 500; // 個人消災每份

// 單筆牌位金額：全家/個人消災依範圍計價（未選擇則不計），其餘固定 500
function tabletRowPrice(tabletKey: string, entry: TabletEntry): number {
  if (tabletKey === "quanjia") {
    if (entry.scope === "全家") return PRICE_FAMILY;
    if (entry.scope === "個人") return PRICE_PERSONAL;
    return 0; // 尚未選擇全家/個人，不列入計算
  }
  return PRICE_PER_TABLET;
}

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
  // 依同一筆其他欄位動態調整標籤／提示／唯讀（例如超薦祖先依類別切換）
  dynamic?: (entry: TabletEntry) => {
    label?: string;
    placeholder?: string;
    hint?: React.ReactNode;
    readOnly?: boolean;
  };
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
        key: "scope",
        fieldId: "ancestor_category",
        label: "祖先類別",
        required: true,
        options: ["單位祖先", "歷代祖先"],
      },
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
        placeholder: "請先選擇上方祖先類別",
        dynamic: (e) =>
          e.scope === "歷代祖先"
            ? {
                label: "祖先姓氏",
                placeholder: "請輸入姓氏（例：黃）",
              }
            : e.scope === "單位祖先"
            ? {
                label: "祖先完整姓名",
                placeholder: "請輸入完整姓名（例：黃大明）",
              }
            : { placeholder: "請先選擇上方祖先類別", readOnly: true },
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
    key: "diji",
    title: "超薦地基主牌位",
    subtableKey: "1003712",
    fields: [
      {
        key: "yangName",
        fieldId: "1003710",
        label: "超薦人",
        required: true,
        sameAsMainName: true,
        placeholder: "請輸入超薦人姓名",
      },
      {
        key: "address",
        fieldId: "1003711",
        label: "地基主地址",
        required: true,
        isAddress: true,
        placeholder: "請輸入地基主地址",
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
  hidePlaceholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  hidePlaceholder?: boolean;
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
        {!hidePlaceholder && <option value="">{placeholder || "請選擇"}</option>}
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

function SummaryRow({
  label,
  value,
  small,
}: {
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    <div className={`flex gap-2 ${small ? "text-xs" : "text-sm"}`}>
      <span className="text-gray-500 shrink-0 w-28">{label}</span>
      <span className="text-gray-800 font-medium break-words">
        {value || "-"}
      </span>
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
  const [gender, setGender] = useState("");

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
  const errorRef = useRef<HTMLDivElement>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

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
  const tabletAmount = TABLET_CONFIGS.reduce((sum, c) => {
    const t = tablets[c.key];
    if (t.wants !== "是") return sum;
    return sum + t.entries.reduce((s, e) => s + tabletRowPrice(c.key, e), 0);
  }, 0);
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
    if (!gender) errs.push("請選擇性別");
    if (!agreed) errs.push("請閱讀並勾選同意隱私權政策");
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

  // 點「提交資料」：先驗證，通過後跳出確認視窗
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitResult(null);

    const validationErrors = validate();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      // 等錯誤區塊渲染後再捲動定位到它
      requestAnimationFrame(() => {
        errorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      return;
    }
    setErrors([]);
    setShowConfirm(true);
  }

  // 確認視窗按「確認送出」：真正送出資料
  async function handleConfirmSubmit() {
    setSubmitResult(null);

    // 組合各牌位子表格資料
    const tabletPayload: Record<string, TabletEntry[]> = {};
    TABLET_CONFIGS.forEach((cfg) => {
      const t = tablets[cfg.key];
      if (t.wants !== "是") {
        tabletPayload[cfg.key] = [];
        return;
      }
      if (cfg.key === "ancestor") {
        // 超薦祖先：把「單位祖先／歷代祖先」類別前置到姓名值一起送出
        tabletPayload[cfg.key] = t.entries.map((e) => ({
          ...e,
          targetName: e.scope ? `${e.scope}：${e.targetName}` : e.targetName,
        }));
      } else {
        tabletPayload[cfg.key] = t.entries;
      }
    });

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          gender,
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
        setShowConfirm(false);
        setSubmitResult({
          success: false,
          message: `${result.error || "提交失敗，請稍後再試"}${detail}`,
        });
      }
    } catch {
      setShowConfirm(false);
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
              國曆9月4日
            </p>
            <h1 className="text-2xl md:text-3xl font-bold tracking-wide text-amber-200 drop-shadow">
              中元普渡報名表
            </h1>
            <p className="text-amber-100/80 text-sm mt-2 tracking-widest">
              普渡十方・慎終追遠
            </p>
          </div>
        </div>

        {/* Error messages */}
        {errors.length > 0 && (
          <div
            ref={errorRef}
            className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 scroll-mt-4"
          >
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
                label="請選擇性別"
                value={gender}
                onChange={setGender}
                options={GENDER_OPTIONS}
                required
              />
              <SelectField
                label="參加份數"
                value={participationCount}
                onChange={setParticipationCount}
                options={COUNT_OPTIONS}
                required
                hidePlaceholder
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
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                時辰
                <span className="text-red-500 ml-1">*</span>
              </label>
              <select
                value={timeOfBirth}
                onChange={(e) => setTimeOfBirth(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-red-500 focus:ring-2 focus:ring-red-200 focus:outline-none transition"
              >
                <option value="">請選擇</option>
                {TIME_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
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
                            cfg.fields.length === 4
                              ? "md:grid-cols-2"
                              : cfg.fields.length >= 3
                              ? "md:grid-cols-3"
                              : "md:grid-cols-2"
                          }`}
                        >
                          {cfg.fields.map((f) => {
                            const dyn = f.dynamic ? f.dynamic(entry) : null;
                            const fieldLabel = dyn?.label ?? f.label;
                            const fieldHint = dyn?.hint ?? f.hint;
                            const fieldPlaceholder =
                              dyn?.placeholder ?? f.placeholder;
                            const fieldReadOnly = dyn?.readOnly ?? false;
                            return (
                            <div key={f.fieldId}>
                              <label className="block text-sm font-semibold text-gray-700 mb-1">
                                {fieldLabel}
                                {f.required && (
                                  <span className="text-red-500 ml-1">*</span>
                                )}
                              </label>
                              {fieldHint ? (
                                <p className="text-xs text-gray-500 mb-2 leading-relaxed">
                                  {fieldHint}
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
                                  readOnly={fieldReadOnly}
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
                                  placeholder={fieldPlaceholder}
                                  className={`w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-red-500 focus:ring-2 focus:ring-red-200 focus:outline-none transition ${
                                    fieldReadOnly
                                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                      : "bg-white"
                                  }`}
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
                            );
                          })}
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
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm text-gray-700 space-y-1 min-w-0">
                  <p>
                    參加份數 ×{shares || 0}：NT$ {shareAmount.toLocaleString()}
                  </p>
                  {totalTabletRows > 0 && (
                    <p>加購牌位：NT$ {tabletAmount.toLocaleString()}</p>
                  )}
                  {TABLET_CONFIGS.map((cfg) => {
                    const t = tablets[cfg.key];
                    if (t.wants !== "是" || t.entries.length === 0) return null;
                    const n = t.entries.length;
                    const amount = t.entries.reduce(
                      (s, e) => s + tabletRowPrice(cfg.key, e),
                      0
                    );
                    return (
                      <p key={cfg.key} className="text-xs text-gray-500 ml-2">
                        └ {cfg.title} ×{n}：NT$ {amount.toLocaleString()}
                      </p>
                    );
                  })}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-500 mb-1">應付總額</p>
                  <p className="text-2xl font-bold text-red-700 whitespace-nowrap">
                    NT$ {totalAmount.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 同意隱私權政策 */}
          <div className="bg-white rounded-2xl shadow-md p-6 mb-6 border-t-4 border-amber-400">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="h-5 w-5 mt-0.5 shrink-0 rounded border-gray-300 text-red-600 focus:ring-red-400"
              />
              <span className="text-sm text-gray-700 leading-relaxed">
                我已詳細閱讀並同意
                <button
                  type="button"
                  onClick={() => setShowPrivacy(true)}
                  className="text-red-700 font-semibold underline underline-offset-2 mx-1 hover:text-red-800"
                >
                  《隱私權政策》
                </button>
                ，並同意主辦單位為法會報名及超薦事宜蒐集、處理及利用本表所填之個人資料。
                <span className="text-red-500 ml-1">*</span>
              </span>
            </label>
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

          {/* 活動海報 */}
          <div className="mt-8">
            <img
              src="/poster.jpg"
              alt="慶讚中元 中元普渡祈福海報"
              className="mx-auto w-full max-w-md rounded-2xl shadow-xl border-2 border-amber-400"
            />
          </div>
        </form>
      </div>

      {/* ===== 確認視窗 ===== */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden border-t-4 border-amber-400">
            {/* 標題 */}
            <div className="bg-gradient-to-b from-red-700 to-red-800 px-6 py-4">
              <h2 className="text-lg font-bold text-amber-200 text-center tracking-widest">
                請確認報名資料
              </h2>
              <p className="text-amber-100/70 text-xs text-center mt-1">
                送出前請再次核對以下內容
              </p>
            </div>

            {/* 內容 */}
            <div className="p-6 space-y-5 overflow-y-auto">
              {/* 基本資料 */}
              <div>
                <p className="font-bold text-red-800 text-sm mb-2 border-b border-red-100 pb-1">
                  基本資料
                </p>
                <div className="space-y-1">
                  <SummaryRow label="姓名" value={name} />
                  <SummaryRow label="性別" value={gender} />
                  <SummaryRow label="參加份數" value={`${participationCount} 份`} />
                  <SummaryRow label="農曆出生年月日" value={lunarBirth} />
                  <SummaryRow label="時辰" value={timeOfBirth} />
                  <SummaryRow label="國家" value={country} />
                  <SummaryRow label="居住地址" value={residenceAddress} />
                  {address2 && <SummaryRow label="地址2" value={address2} />}
                  <SummaryRow
                    label="公司行號"
                    value={
                      hasCompany === "是"
                        ? `${companyName}（${companyAddress}）`
                        : "無"
                    }
                  />
                </div>
              </div>

              {/* 各牌位 */}
              {TABLET_CONFIGS.map((cfg) => {
                const t = tablets[cfg.key];
                if (t.wants !== "是" || t.entries.length === 0) return null;
                return (
                  <div key={cfg.key}>
                    <p className="font-bold text-red-800 text-sm mb-2 border-b border-red-100 pb-1">
                      {cfg.title}（{t.entries.length} 筆）
                    </p>
                    <div className="space-y-2">
                      {t.entries.map((entry, i) => (
                        <div
                          key={i}
                          className="rounded-lg bg-red-50/60 border border-red-100 p-3"
                        >
                          <p className="text-xs font-semibold text-red-700 mb-1">
                            第 {i + 1} 筆
                          </p>
                          <div className="space-y-1">
                            {cfg.fields.map((f) => (
                              <SummaryRow
                                key={f.fieldId}
                                label={f.label}
                                value={entry[f.key]}
                                small
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* 金額 */}
              <div>
                <p className="font-bold text-red-800 text-sm mb-2 border-b border-red-100 pb-1">
                  法會金額
                </p>
                <div className="space-y-1 text-sm text-gray-700">
                  <div className="flex justify-between">
                    <span>參加份數 ×{shares}</span>
                    <span>NT$ {shareAmount.toLocaleString()}</span>
                  </div>
                  {totalTabletRows > 0 && (
                    <div className="flex justify-between">
                      <span>加購牌位</span>
                      <span>NT$ {tabletAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center border-t border-red-100 pt-2 mt-1">
                    <span className="font-bold text-red-800">應付總額</span>
                    <span className="text-xl font-bold text-red-700">
                      NT$ {totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 按鈕 */}
            <div className="border-t border-gray-200 p-4 flex gap-3 bg-gray-50">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={isSubmitting}
                className="flex-1 rounded-xl border border-gray-300 bg-white text-gray-700 font-semibold py-3 hover:bg-gray-100 transition disabled:opacity-50"
              >
                返回修改
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 text-amber-200 font-bold py-3 ring-1 ring-amber-400/60 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
                    送出中...
                  </>
                ) : (
                  "確認送出"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== 隱私權政策 ===== */}
      {showPrivacy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden border-t-4 border-amber-400">
            <div className="bg-gradient-to-b from-red-700 to-red-800 px-6 py-4">
              <h2 className="text-lg font-bold text-amber-200 text-center tracking-widest">
                隱私權政策
              </h2>
              <p className="text-amber-100/70 text-xs text-center mt-1">
                鑫富閣財樂宮 中元普渡報名
              </p>
            </div>

            <div className="p-6 overflow-y-auto text-sm text-gray-700 leading-relaxed space-y-4">
              <p>
                鑫富閣財樂宮（以下簡稱「本宮」）非常重視您的個人資料保護。當您填寫本中元普渡報名表時，即表示您已閱讀、瞭解並同意本隱私權政策之所有內容。本政策依《個人資料保護法》相關規定訂定。
              </p>

              <div>
                <p className="font-bold text-red-800 mb-1">一、蒐集之個人資料項目</p>
                <p>
                  為辦理法會報名與超薦事宜，本宮將蒐集您所填寫之資料，包括：報名人姓名、性別、農曆出生年月日、時辰、聯絡地址、公司名稱與地址；以及各項牌位所填之超薦／陽上人員姓名與地址（例如祖先、冤親債主、地基主、無緣子女、親朋好友、寵物等超薦對象資訊）。
                </p>
              </div>

              <div>
                <p className="font-bold text-red-800 mb-1">二、蒐集目的與利用方式</p>
                <p>
                  所蒐集之個人資料僅供本宮辦理中元普渡法會報名、牌位製作、超薦誦經、法會通知與相關聯繫之用，不會用於前述目的以外之用途。
                </p>
              </div>

              <div>
                <p className="font-bold text-red-800 mb-1">三、資料之保存與保護</p>
                <p>
                  您的資料將儲存於本宮委託之雲端表單系統（Ragic），並採取適當之安全措施防止未經授權之存取。資料保存期間為法會辦理所需之期間，逾期或目的消失後將予以刪除或去識別化。
                </p>
              </div>

              <div>
                <p className="font-bold text-red-800 mb-1">四、資料之提供與揭露</p>
                <p>
                  除法令另有規定或經您同意外，本宮不會將您的個人資料提供、揭露或出售予第三人。
                </p>
              </div>

              <div>
                <p className="font-bold text-red-800 mb-1">五、您的權利</p>
                <p>
                  依《個人資料保護法》第三條，您就本宮保有之個人資料得行使下列權利：查詢或請求閱覽、請求製給複製本、請求補充或更正、請求停止蒐集處理利用，以及請求刪除。如欲行使上述權利，請與本宮聯繫。
                </p>
              </div>

              <div>
                <p className="font-bold text-red-800 mb-1">六、同意與撤回</p>
                <p>
                  您可自由選擇是否提供個人資料，惟若不提供必要資料，本宮將無法為您完成法會報名與超薦。您得隨時撤回同意，惟撤回不影響撤回前已進行之處理。
                </p>
              </div>

              <div>
                <p className="font-bold text-red-800 mb-1">七、政策修訂</p>
                <p>
                  本宮保留隨時修訂本隱私權政策之權利，修訂後將公告於報名頁面，恕不另行個別通知。
                </p>
              </div>

              <p className="text-xs text-gray-500">
                如對本政策有任何疑問，請聯絡主辦單位。
              </p>
            </div>

            <div className="border-t border-gray-200 p-4 flex gap-3 bg-gray-50">
              <button
                type="button"
                onClick={() => setShowPrivacy(false)}
                className="flex-1 rounded-xl border border-gray-300 bg-white text-gray-700 font-semibold py-3 hover:bg-gray-100 transition"
              >
                關閉
              </button>
              <button
                type="button"
                onClick={() => {
                  setAgreed(true);
                  setShowPrivacy(false);
                }}
                className="flex-1 rounded-xl bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 text-amber-200 font-bold py-3 ring-1 ring-amber-400/60 transition"
              >
                我已閱讀並同意
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
