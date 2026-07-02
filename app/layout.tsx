import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "中元普渡報名表",
  description: "中元普渡報名表單",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <body className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 min-h-screen">
        {children}
      </body>
    </html>
  );
}
