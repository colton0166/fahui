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

const BABY_SPIRIT_COUNT_OPTIONS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
const INVALID_SPIRIT_NAMES = ["沒有", "無", "沒", "不知道", "不知", "未知", "N/A", "na", "none", "null", "不清楚"];

interface BabySpiritEntry {
  name: string;
  address: string;
  sameAsResidence: boolean;
  recommenderName: string;
  sameAsMainName: boolean;
}
const GENDER_OPTIONS = ["信士", "信女"];
const YES_NO = ["是", "否"];
const TIME_OPTIONS = [
  "子", "丑", "寅", "卯", "辰", "巳",
  "午", "未", "申", "酉", "戌", "亥", "吉",
];
const LUNAR_DAY_OPTIONS = [
  "初一","初二","初三","初四","初五","初六","初七","初八","初九","初十",
  "十一","十二","十三","十四","十五","十六","十七","十八","十九","二十",
  "廿一","廿二","廿三","廿四","廿五","廿六","廿七","廿八","廿九","三十",
];

function toChineseNumeral(num: number): string {
  if (num <= 0) return String(num);
  const digits = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  if (num < 10) return digits[num];
  if (num === 10) return '十';
  if (num < 20) return '十' + digits[num % 10];
  if (num < 100) {
    const t = Math.floor(num / 10);
    const o = num % 10;
    return digits[t] + '十' + (o ? digits[o] : '');
  }
  const h = Math.floor(num / 100);
  const remainder = num % 100;
  let result = digits[h] + '百';
  if (remainder === 0) return result;
  if (remainder < 10) return result + '零' + digits[remainder];
  return result + toChineseNumeral(remainder);
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
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-none disabled:bg-gray-100 disabled:text-gray-500 transition"
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
        className={`w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-none transition ${
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
      <div className="w-full rounded-lg border border-gray-200 bg-amber-50/50 px-3 py-2.5 text-sm text-gray-700 min-h-[40px]">
        {value || "-"}
      </div>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4 mt-2">
      <div className="h-px flex-1 bg-gradient-to-r from-amber-300 to-transparent" />
      <h2 className="text-lg font-bold text-amber-800 whitespace-nowrap">
        {title}
      </h2>
      <div className="h-px flex-1 bg-gradient-to-l from-amber-300 to-transparent" />
    </div>
  );
}

export default function FormPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [hasNickname, setHasNickname] = useState("");
  const [nickname, setNickname] = useState("");

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

  const [hasCompany, setHasCompany] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");

  const [wantsEmail, setWantsEmail] = useState("");
  const [email, setEmail] = useState("");

  const [wantsBabySpirit, setWantsBabySpirit] = useState("");
  const [babySpiritCount, setBabySpiritCount] = useState("");
  const [babySpiritEntries, setBabySpiritEntries] = useState<BabySpiritEntry[]>([]);

  const [wantsAncestor, setWantsAncestor] = useState("");
  const [ancestorCount, setAncestorCount] = useState("");
  const [ancestorEntries, setAncestorEntries] = useState<BabySpiritEntry[]>([]);

  const [wantsKarmicCreditor, setWantsKarmicCreditor] = useState("");
  const [karmicCreditorCount, setKarmicCreditorCount] = useState("");
  const [karmicCreditorEntries, setKarmicCreditorEntries] = useState<BabySpiritEntry[]>([]);

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
    if (hasNickname === "否") setNickname("");
  }, [hasNickname]);

  useEffect(() => {
    if (hasCompany === "否") {
      setCompanyName("");
      setCompanyAddress("");
    }
  }, [hasCompany]);

  useEffect(() => {
    if (wantsEmail === "否") setEmail("");
  }, [wantsEmail]);

  useEffect(() => {
    if (wantsBabySpirit === "否") {
      setBabySpiritCount("");
      setBabySpiritEntries([]);
    }
  }, [wantsBabySpirit]);

  useEffect(() => {
    const count = parseInt(babySpiritCount) || 0;
    setBabySpiritEntries((prev) => {
      if (count === 0) return [];
      const newEntries: BabySpiritEntry[] = [];
      for (let i = 0; i < count; i++) {
        newEntries.push(
          prev[i] || { name: "", address: "", sameAsResidence: false, recommenderName: "", sameAsMainName: false }
        );
      }
      return newEntries;
    });
  }, [babySpiritCount]);

  useEffect(() => {
    if (wantsAncestor === "否") {
      setAncestorCount("");
      setAncestorEntries([]);
    }
  }, [wantsAncestor]);

  useEffect(() => {
    const count = parseInt(ancestorCount) || 0;
    setAncestorEntries((prev) => {
      if (count === 0) return [];
      const newEntries: BabySpiritEntry[] = [];
      for (let i = 0; i < count; i++) {
        newEntries.push(
          prev[i] || { name: "", address: "", sameAsResidence: false, recommenderName: "", sameAsMainName: false }
        );
      }
      return newEntries;
    });
  }, [ancestorCount]);

  useEffect(() => {
    if (wantsKarmicCreditor === "否") {
      setKarmicCreditorCount("");
      setKarmicCreditorEntries([]);
    }
  }, [wantsKarmicCreditor]);

  useEffect(() => {
    const count = parseInt(karmicCreditorCount) || 0;
    setKarmicCreditorEntries((prev) => {
      if (count === 0) return [];
      const newEntries: BabySpiritEntry[] = [];
      for (let i = 0; i < count; i++) {
        newEntries.push(
          prev[i] || { name: "", address: "", sameAsResidence: false, recommenderName: "", sameAsMainName: false }
        );
      }
      return newEntries;
    });
  }, [karmicCreditorCount]);

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
  const nicknameDisplay = nickname ? `綽號：${nickname}` : "";
  const companyAddressDisplay = companyAddress ? `(${companyAddress})` : "";
  const minguoYearShort = lunarYear ? lunarYear.substring(0, 3) : "";

  const currentYear = new Date().getFullYear();
  const birthSolarYear = lunarData?.lunar_solar_year || 0;
  const ageDisplay = birthSolarYear
    ? `${currentYear - birthSolarYear + 1}`
    : "";
  const lunarAgeDisplay = birthSolarYear
    ? toChineseNumeral(currentYear - birthSolarYear + 1)
    : "";

  const babySpiritTotal = wantsBabySpirit === "是" ? babySpiritEntries.length : 0;
  const ancestorTotal = wantsAncestor === "是" ? ancestorEntries.length : 0;
  const karmicCreditorTotal = wantsKarmicCreditor === "是" ? karmicCreditorEntries.length : 0;
  const allTabletTotal = babySpiritTotal + ancestorTotal + karmicCreditorTotal;
  const totalAmount = 1800 + Math.max(0, allTabletTotal - 1) * 1800;
  const ganZhiDisplay = lunarData?.gan_zhi_year || "";
  const lunarYearChineseDisplay = lunarData?.lunar_year || "";
  const zodiacDisplay = lunarData?.zodiac || "";

  function validate(): string[] {
    const errs: string[] = [];
    if (!name.trim()) errs.push("請輸入姓名");
    if (!gender) errs.push("請選擇性別");
    if (!hasNickname) errs.push("請選擇是否有綽號");
    if (!country) errs.push("請選擇國家");
    if (!birthYear || !birthMonth || !birthDay)
      errs.push("請選擇完整的國曆出生日期");
    if (!lunarYear) errs.push("無法取得農曆資料，請確認出生日期");
    if (!timeOfBirth) errs.push("請選擇時辰");
    if (country === "臺灣" && !address.trim()) errs.push("請輸入地址");
    if (!hasCompany) errs.push("請選擇是否有公司行號");
    if (hasCompany === "是") {
      if (!companyName.trim()) errs.push("請輸入公司名稱");
      if (!companyAddress.trim()) errs.push("請輸入公司地址");
    }
    if (!wantsEmail) errs.push("請選擇是否要收到資料郵件");
    if (wantsEmail === "是" && !email.trim()) errs.push("請輸入 Email");
    // 三種牌位合計至少要有1組
    const totalTablets =
      (wantsBabySpirit === "是" ? babySpiritEntries.length : 0) +
      (wantsAncestor === "是" ? ancestorEntries.length : 0) +
      (wantsKarmicCreditor === "是" ? karmicCreditorEntries.length : 0);
    if (totalTablets === 0) {
      errs.push("嬰靈牌位、祖先牌位、冤親債主牌位至少需填寫一組牌位資料");
    }
    // 嬰靈牌位驗證
    if (wantsBabySpirit === "是") {
      if (!babySpiritCount) errs.push("請選擇嬰靈牌位數量");
      babySpiritEntries.forEach((entry, i) => {
        const trimmedName = entry.name.trim();
        if (
          trimmedName &&
          INVALID_SPIRIT_NAMES.some((inv) => inv.toLowerCase() === trimmedName.toLowerCase())
        ) {
          errs.push(`嬰靈牌位第 ${i + 1} 筆：嬰靈姓名不可填寫「${trimmedName}」`);
        }
        if (!entry.address.trim()) {
          errs.push(`嬰靈牌位第 ${i + 1} 筆：請輸入地址`);
        }
        if (!entry.recommenderName.trim()) {
          errs.push(`嬰靈牌位第 ${i + 1} 筆：請輸入求薦者姓名`);
        }
      });
    }
    // 祖先牌位驗證
    if (wantsAncestor === "是") {
      if (!ancestorCount) errs.push("請選擇祖先牌位數量");
      ancestorEntries.forEach((entry, i) => {
        const trimmedName = entry.name.trim();
        if (!trimmedName) {
          errs.push(`祖先牌位第 ${i + 1} 筆：請輸入祖先牌位名稱`);
        } else if (INVALID_SPIRIT_NAMES.some((inv) => inv.toLowerCase() === trimmedName.toLowerCase())) {
          errs.push(`祖先牌位第 ${i + 1} 筆：祖先牌位名稱不可填寫「${trimmedName}」`);
        }
        if (!entry.address.trim()) {
          errs.push(`祖先牌位第 ${i + 1} 筆：請輸入牌位地址`);
        }
      });
    }
    // 冤親債主牌位驗證
    if (wantsKarmicCreditor === "是") {
      if (!karmicCreditorCount) errs.push("請選擇冤親債主牌位數量");
      karmicCreditorEntries.forEach((entry, i) => {
        if (!entry.recommenderName.trim()) {
          errs.push(`冤親債主第 ${i + 1} 筆：請輸入求薦者姓名`);
        }
        if (!entry.address.trim()) {
          errs.push(`冤親債主第 ${i + 1} 筆：請輸入居住地址`);
        }
      });
    }
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

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          gender,
          hasNickname,
          nickname: hasNickname === "是" ? nickname : "",
          country,
          city,
          district,
          address,
          address2,
          lunarYear,
          lunarMonth,
          lunarDay,
          timeOfBirth,
          hasCompany,
          companyName: hasCompany === "是" ? companyName : "",
          companyAddress: hasCompany === "是" ? companyAddress : "",
          wantsEmail,
          email: wantsEmail === "是" ? email : "",
          // 唯讀/計算欄位
          nicknameDisplay,
          residenceAddress,
          ganZhiYear: ganZhiDisplay,
          age: ageDisplay,
          lunarAge: lunarAgeDisplay,
          lunarYearChinese: lunarYearChineseDisplay,
          companyAddressDisplay,
          minguoYearShort,
          // 嬰靈牌位子表格
          babySpiritEntries: wantsBabySpirit === "是" ? babySpiritEntries.map((e) => ({
            name: e.name,
            address: e.address,
            recommenderName: e.recommenderName,
          })) : [],
          // 祖先牌位子表格
          ancestorEntries: wantsAncestor === "是" ? ancestorEntries.map((e) => ({
            name: e.name,
            address: e.address,
          })) : [],
          // 冤親債主子表格
          karmicCreditorEntries: wantsKarmicCreditor === "是" ? karmicCreditorEntries.map((e) => ({
            recommenderName: e.recommenderName,
            address: e.address,
          })) : [],
          // 金額
          totalAmount: String(totalAmount),
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
          <div className="inline-block bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 text-white px-8 py-4 rounded-2xl shadow-lg">
            <h1 className="text-2xl md:text-3xl font-bold tracking-wide">
              清明慎終追遠法會報名表
            </h1>
            <p className="text-amber-100 text-sm mt-1">
              請詳細填寫以下資料
            </p>
          </div>
        </div>

        {/* Error messages */}
        {errors.length > 0 && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="font-semibold text-red-700 mb-2">
              請修正以下問題：
            </p>
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
          <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
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
                label="請問是否有綽號？"
                value={hasNickname}
                onChange={setHasNickname}
                options={YES_NO}
                required
              />
              {hasNickname === "是" && (
                <TextField
                  label="請輸入綽號"
                  value={nickname}
                  onChange={setNickname}
                  placeholder="請輸入綽號"
                />
              )}
            </div>
          </div>

          {/* ===== 出生資料 ===== */}
          <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
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
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-none transition"
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
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-none transition"
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
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-none transition"
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
              <div className="text-sm text-amber-600 mb-3 flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
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
                正在轉換農曆...
              </div>
            )}

            {lunarData && (
              <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 mb-4">
                <p className="text-sm font-semibold text-amber-800 mb-3">
                  農曆轉換結果
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <ReadOnlyField label="西元民國年" value={lunarYear} />
                  <ReadOnlyField label="農曆出生月" value={lunarMonth} />
                  <ReadOnlyField label="農曆出生日" value={lunarDay} />
                  <ReadOnlyField
                    label="生肖"
                    value={zodiacDisplay}
                  />
                  <ReadOnlyField label="歲次" value={ganZhiDisplay} />
                  <ReadOnlyField
                    label="農曆年國字"
                    value={lunarYearChineseDisplay}
                  />
                  <ReadOnlyField
                    label="歲數（虛歲）"
                    value={ageDisplay}
                  />
                  <ReadOnlyField
                    label="農曆年（民國）"
                    value={minguoYearShort}
                  />
                </div>
              </div>
            )}

            <SelectField
              label="時辰"
              value={timeOfBirth}
              onChange={setTimeOfBirth}
              options={TIME_OPTIONS}
              required
            />
          </div>

          {/* ===== 地址資料 ===== */}
          <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
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
                <ReadOnlyField
                  label="居住地址（自動組合）"
                  value={residenceAddress}
                />
              </div>
            )}
          </div>

          {/* ===== 公司資料 ===== */}
          <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
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
                    label="請輸入公司名稱"
                    value={companyName}
                    onChange={setCompanyName}
                    placeholder="請輸入公司名稱"
                    required
                  />
                  <TextField
                    label="請輸入公司地址"
                    value={companyAddress}
                    onChange={setCompanyAddress}
                    placeholder="請輸入公司地址"
                    required
                  />
                </>
              )}
            </div>
          </div>

          {/* ===== 聯絡資料 ===== */}
          <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
            <SectionTitle title="聯絡資料" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField
                label="請問是否要收到資料郵件？"
                value={wantsEmail}
                onChange={setWantsEmail}
                options={YES_NO}
                required
              />
              {wantsEmail === "是" && (
                <TextField
                  label="Email"
                  value={email}
                  onChange={setEmail}
                  placeholder="請輸入電子郵件"
                  type="email"
                  required
                />
              )}
            </div>
          </div>

          {/* ===== 嬰靈牌位 ===== */}
          <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
            <SectionTitle title="嬰靈牌位" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField
                label="是否要增購嬰靈牌位？"
                value={wantsBabySpirit}
                onChange={setWantsBabySpirit}
                options={YES_NO}
                required
              />
              {wantsBabySpirit === "是" && (
                <SelectField
                  label="請選擇嬰靈牌位數量"
                  value={babySpiritCount}
                  onChange={setBabySpiritCount}
                  options={BABY_SPIRIT_COUNT_OPTIONS}
                  required
                />
              )}
            </div>

            {wantsBabySpirit === "是" && babySpiritEntries.length > 0 && (
              <div className="mt-6 space-y-4">
                {babySpiritEntries.map((entry, idx) => (
                  <div
                    key={idx}
                    className="border border-amber-200 rounded-xl p-4 bg-amber-50/30"
                  >
                    <p className="text-sm font-bold text-amber-800 mb-3">
                      第 {idx + 1} 筆
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          嬰靈牌位
                        </label>
                        <input
                          type="text"
                          value={entry.name}
                          onChange={(e) => {
                            const updated = [...babySpiritEntries];
                            updated[idx] = { ...updated[idx], name: e.target.value };
                            setBabySpiritEntries(updated);
                          }}
                          placeholder="請輸入嬰靈姓名（可留白）"
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-none transition"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          不可填寫「沒有」等無效內容
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          地址
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                          type="text"
                          value={entry.address}
                          onChange={(e) => {
                            const updated = [...babySpiritEntries];
                            updated[idx] = {
                              ...updated[idx],
                              address: e.target.value,
                              sameAsResidence: false,
                            };
                            setBabySpiritEntries(updated);
                          }}
                          placeholder="請輸入地址"
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-none transition"
                        />
                        <label className="inline-flex items-center gap-2 mt-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={entry.sameAsResidence}
                            onChange={(e) => {
                              const updated = [...babySpiritEntries];
                              updated[idx] = {
                                ...updated[idx],
                                sameAsResidence: e.target.checked,
                                address: e.target.checked
                                  ? residenceAddress
                                  : "",
                              };
                              setBabySpiritEntries(updated);
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-amber-500 focus:ring-amber-400"
                          />
                          <span className="text-sm text-gray-600">
                            與居住地址相同
                          </span>
                        </label>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          求薦者姓名
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                          type="text"
                          value={entry.recommenderName}
                          onChange={(e) => {
                            const updated = [...babySpiritEntries];
                            updated[idx] = { ...updated[idx], recommenderName: e.target.value };
                            setBabySpiritEntries(updated);
                          }}
                          placeholder="請輸入求薦者姓名"
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-none transition"
                        />
                        <label className="inline-flex items-center gap-2 mt-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={entry.sameAsMainName}
                            onChange={(e) => {
                              const updated = [...babySpiritEntries];
                              updated[idx] = {
                                ...updated[idx],
                                sameAsMainName: e.target.checked,
                                recommenderName: e.target.checked ? name : "",
                              };
                              setBabySpiritEntries(updated);
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-amber-500 focus:ring-amber-400"
                          />
                          <span className="text-sm text-gray-600">
                            與基本資料姓名相同
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ===== 祖先牌位 ===== */}
          <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
            <SectionTitle title="祖先牌位" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField
                label="是否要增購祖先牌位？"
                value={wantsAncestor}
                onChange={setWantsAncestor}
                options={YES_NO}
                required
              />
              {wantsAncestor === "是" && (
                <SelectField
                  label="請選擇祖先牌位數量"
                  value={ancestorCount}
                  onChange={setAncestorCount}
                  options={BABY_SPIRIT_COUNT_OPTIONS}
                  required
                />
              )}
            </div>

            {wantsAncestor === "是" && ancestorEntries.length > 0 && (
              <div className="mt-6 space-y-4">
                {ancestorEntries.map((entry, idx) => (
                  <div
                    key={idx}
                    className="border border-amber-200 rounded-xl p-4 bg-amber-50/30"
                  >
                    <p className="text-sm font-bold text-amber-800 mb-3">
                      第 {idx + 1} 筆
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          祖先牌位
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <p className="text-xs text-gray-500 mb-2 leading-relaxed">
                          • 報名「歷代祖先」請填寫 <span className="font-bold text-amber-700">姓氏</span><br />
                          • 報名「指定祖先」請填寫 <span className="font-bold text-amber-700">祖先姓名</span>
                        </p>
                        <input
                          type="text"
                          value={entry.name}
                          onChange={(e) => {
                            const updated = [...ancestorEntries];
                            updated[idx] = { ...updated[idx], name: e.target.value };
                            setAncestorEntries(updated);
                          }}
                          placeholder="例：黃 或 黃OO"
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-none transition"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          牌位地址
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <p className="text-xs text-transparent mb-2 leading-relaxed select-none">
                          • 報名「歷代祖先」請填寫姓氏
                          <br />
                          • 報名「指定祖先」請填寫祖先姓名
                        </p>
                        <input
                          type="text"
                          value={entry.address}
                          onChange={(e) => {
                            const updated = [...ancestorEntries];
                            updated[idx] = {
                              ...updated[idx],
                              address: e.target.value,
                              sameAsResidence: false,
                            };
                            setAncestorEntries(updated);
                          }}
                          placeholder="請輸入牌位地址"
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-none transition"
                        />
                        <label className="inline-flex items-center gap-2 mt-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={entry.sameAsResidence}
                            onChange={(e) => {
                              const updated = [...ancestorEntries];
                              updated[idx] = {
                                ...updated[idx],
                                sameAsResidence: e.target.checked,
                                address: e.target.checked
                                  ? residenceAddress
                                  : "",
                              };
                              setAncestorEntries(updated);
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-amber-500 focus:ring-amber-400"
                          />
                          <span className="text-sm text-gray-600">
                            與居住地址相同
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ===== 冤親債主牌位 ===== */}
          <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
            <SectionTitle title="冤親債主牌位" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField
                label="是否要增購冤親債主牌位？"
                value={wantsKarmicCreditor}
                onChange={setWantsKarmicCreditor}
                options={YES_NO}
                required
              />
              {wantsKarmicCreditor === "是" && (
                <SelectField
                  label="請選擇冤親債主牌位數量"
                  value={karmicCreditorCount}
                  onChange={setKarmicCreditorCount}
                  options={BABY_SPIRIT_COUNT_OPTIONS}
                  required
                />
              )}
            </div>

            {wantsKarmicCreditor === "是" && karmicCreditorEntries.length > 0 && (
              <div className="mt-6 space-y-4">
                {karmicCreditorEntries.map((entry, idx) => (
                  <div
                    key={idx}
                    className="border border-amber-200 rounded-xl p-4 bg-amber-50/30"
                  >
                    <p className="text-sm font-bold text-amber-800 mb-3">
                      第 {idx + 1} 筆
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          求薦者姓名
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                          type="text"
                          value={entry.recommenderName}
                          onChange={(e) => {
                            const updated = [...karmicCreditorEntries];
                            updated[idx] = { ...updated[idx], recommenderName: e.target.value };
                            setKarmicCreditorEntries(updated);
                          }}
                          placeholder="請輸入求薦者姓名"
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-none transition"
                        />
                        <label className="inline-flex items-center gap-2 mt-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={entry.sameAsMainName}
                            onChange={(e) => {
                              const updated = [...karmicCreditorEntries];
                              updated[idx] = {
                                ...updated[idx],
                                sameAsMainName: e.target.checked,
                                recommenderName: e.target.checked ? name : "",
                              };
                              setKarmicCreditorEntries(updated);
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-amber-500 focus:ring-amber-400"
                          />
                          <span className="text-sm text-gray-600">
                            與基本資料姓名相同
                          </span>
                        </label>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          居住地址
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                          type="text"
                          value={entry.address}
                          onChange={(e) => {
                            const updated = [...karmicCreditorEntries];
                            updated[idx] = {
                              ...updated[idx],
                              address: e.target.value,
                              sameAsResidence: false,
                            };
                            setKarmicCreditorEntries(updated);
                          }}
                          placeholder="請輸入居住地址"
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-none transition"
                        />
                        <label className="inline-flex items-center gap-2 mt-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={entry.sameAsResidence}
                            onChange={(e) => {
                              const updated = [...karmicCreditorEntries];
                              updated[idx] = {
                                ...updated[idx],
                                sameAsResidence: e.target.checked,
                                address: e.target.checked
                                  ? residenceAddress
                                  : "",
                              };
                              setKarmicCreditorEntries(updated);
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-amber-500 focus:ring-amber-400"
                          />
                          <span className="text-sm text-gray-600">
                            與居住地址相同
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ===== 法會金額 ===== */}
          <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
            <SectionTitle title="法會金額" />
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700 space-y-1">
                  <p>基本費用（含第一組牌位）：NT$ 1,800</p>
                  {allTabletTotal > 1 && (
                    <p>加購牌位 ×{allTabletTotal - 1}：NT$ {((allTabletTotal - 1) * 1800).toLocaleString()}</p>
                  )}
                  {babySpiritTotal > 0 && (
                    <p className="text-xs text-gray-500 ml-2">└ 嬰靈牌位 ×{babySpiritTotal}</p>
                  )}
                  {ancestorTotal > 0 && (
                    <p className="text-xs text-gray-500 ml-2">└ 祖先牌位 ×{ancestorTotal}</p>
                  )}
                  {karmicCreditorTotal > 0 && (
                    <p className="text-xs text-gray-500 ml-2">└ 冤親債主牌位 ×{karmicCreditorTotal}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-1">應付總額</p>
                  <p className="text-2xl font-bold text-amber-700">
                    NT$ {totalAmount.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ===== 自動計算欄位摘要 ===== */}
          {(nicknameDisplay || companyAddressDisplay) && (
            <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
              <SectionTitle title="其他自動欄位" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {nicknameDisplay && (
                  <ReadOnlyField label="綽號顯示" value={nicknameDisplay} />
                )}
                {companyAddressDisplay && (
                  <ReadOnlyField
                    label="公司地址顯示"
                    value={companyAddressDisplay}
                  />
                )}
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="text-center">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-3 px-10 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
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
