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
      <body className="bg-gradient-to-br from-red-800 via-red-900 to-red-950 min-h-screen">
        {children}
      </body>
    </html>
  );
}
