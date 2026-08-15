import type { ReactNode } from "react";

// ── 牌位子表格設定 ──────────────────────────────────────────
export type EntryKey = "scope" | "yangName" | "targetName" | "address";

export interface TabletFieldConfig {
  key: EntryKey;
  fieldId: string;
  label: string;
  required: boolean;
  options?: string[]; // 有值時渲染為單選下拉，否則為文字輸入
  isAddress?: boolean; // 顯示「與居住地址相同」勾選框
  sameAsMainName?: boolean; // 顯示「與基本資料姓名相同」勾選框
  allowBlankName?: boolean; // 允許留白（僅檢查無效字詞）
  hint?: ReactNode;
  placeholder?: string;
  hideInCompany?: boolean; // 公司行號普渡時不顯示此欄位
  companyLabel?: string; // 公司行號普渡時改用的標籤
  companyPlaceholder?: string; // 公司行號普渡時改用的提示字
  // 依同一筆其他欄位動態調整標籤／提示／唯讀（例如超薦祖先依類別切換）
  dynamic?: (entry: TabletEntry) => {
    label?: string;
    placeholder?: string;
    hint?: ReactNode;
    readOnly?: boolean;
  };
}

export interface TabletConfig {
  key: string;
  title: string;
  // 網址數量限制參數名稱，例如 ?sheng=2 限制本牌位最多 2 筆
  limitParam: string;
  subtableKey: string;
  fields: TabletFieldConfig[];
  hideInCompany?: boolean; // 公司行號普渡時不提供此牌位
  onlyInCompany?: boolean; // 僅公司行號普渡時提供此牌位
  companyTitle?: string; // 公司行號普渡時改用的名稱
  // 有值時代表 scope（Ragic 1003682 全家/個人）由系統固定填入，客人不需選擇。
  // 個人／全家／公司祿位三種共用子表格 1003673，送出時會合併為同一組資料。
  fixedScope?: string;
}

export const TABLET_CONFIGS: TabletConfig[] = [
  {
    key: "shengPersonal",
    title: "個人消災長生祿位",
    limitParam: "personal",
    fixedScope: "個人",
    hideInCompany: true,
    subtableKey: "1003673",
    fields: [
      {
        key: "targetName",
        fieldId: "1003657",
        label: "個人消災長生祿位（姓名）",
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
    key: "shengFamily",
    title: "全家消災長生祿位",
    limitParam: "family",
    fixedScope: "全家",
    hideInCompany: true,
    subtableKey: "1003673",
    fields: [
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
    key: "shengCompany",
    title: "公司祿位",
    limitParam: "company",
    fixedScope: "",
    onlyInCompany: true,
    subtableKey: "1003673",
    fields: [
      {
        key: "targetName",
        fieldId: "1003657",
        label: "公司祿位（公司名稱）",
        required: true,
        sameAsMainName: true,
        placeholder: "請輸入公司名稱",
      },
      {
        key: "address",
        fieldId: "1003658",
        label: "公司地址",
        required: true,
        isAddress: true,
        placeholder: "請輸入公司地址",
      },
    ],
  },
  {
    key: "ancestor",
    title: "超薦祖先牌位",
    limitParam: "ancestor",
    hideInCompany: true,
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
    limitParam: "creditor",
    hideInCompany: true,
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
    limitParam: "diji",
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
    limitParam: "baby",
    hideInCompany: true,
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
    limitParam: "friend",
    hideInCompany: true,
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
    limitParam: "pet",
    hideInCompany: true,
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

// ── 網址數量限制 ────────────────────────────────────────────
// 工作人員確認匯款後，用 ?sheng=2&ancestor=1 這類參數指定各牌位可填筆數。
// 參數名稱集中定義於上方 TABLET_CONFIGS 的 limitParam，新增牌位種類時只需改那裡。
export const MAX_TABLET_LIMIT = 100; // 上限，避免異常參數產生大量 DOM

// 回傳 null 代表網址未帶任何有效限制參數 → 維持原本不限制的行為。
// 帶了任何一個有效參數即進入「指定登記模式」，未列出的牌位視為 0。
export function parseTabletLimits(search: string): Record<string, number> | null {
  const params = new URLSearchParams(search);
  const limits: Record<string, number> = {};
  let found = false;

  TABLET_CONFIGS.forEach((cfg) => {
    const raw = params.get(cfg.limitParam);
    if (raw === null) return;
    // 只接受純數字（0 或正整數）；-1、abc、1.5、空字串一律忽略
    if (!/^\d+$/.test(raw.trim())) return;
    limits[cfg.key] = Math.min(parseInt(raw.trim(), 10), MAX_TABLET_LIMIT);
    found = true;
  });

  return found ? limits : null;
}

export interface TabletEntry {
  scope: string;
  yangName: string;
  targetName: string;
  address: string;
  sameAsResidence: boolean;
  sameAsMainName: boolean;
}
