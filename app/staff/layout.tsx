import type { Metadata } from "next";

// 內部工具頁，不希望被搜尋引擎收錄
export const metadata: Metadata = {
  title: "報名連結產生器",
  robots: { index: false, follow: false },
};

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
