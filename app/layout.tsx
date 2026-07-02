import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "鑫富閣中元普渡報名表",
  description: "中元普渡報名表單",
};

// 以固定數值產生金色微粒，避免伺服器/前端隨機值不一致
const EMBERS = Array.from({ length: 22 }, (_, i) => ({
  left: (i * 4.6 + 3) % 100,
  size: 4 + (i % 4) * 2,
  duration: 9 + (i % 6) * 2,
  delay: (i % 11) * 1.4,
  drift: (i % 2 === 0 ? 1 : -1) * (10 + (i % 5) * 8),
}));

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <body className="bg-gradient-to-br from-red-800 via-red-900 to-red-950 min-h-screen">
        {/* 節慶背景特效 */}
        <div
          aria-hidden="true"
          className="festive-bg pointer-events-none fixed inset-0 -z-10 overflow-hidden"
        >
          <div
            className="festive-glow"
            style={{
              top: "-6rem",
              left: "-5rem",
              width: "24rem",
              height: "24rem",
              background:
                "radial-gradient(circle, rgba(255,210,120,0.55), transparent 70%)",
            }}
          />
          <div
            className="festive-glow"
            style={{
              top: "25%",
              right: "-7rem",
              width: "28rem",
              height: "28rem",
              background:
                "radial-gradient(circle, rgba(255,150,60,0.4), transparent 70%)",
              animationDelay: "2.5s",
            }}
          />
          <div
            className="festive-glow"
            style={{
              bottom: "-8rem",
              left: "30%",
              width: "30rem",
              height: "30rem",
              background:
                "radial-gradient(circle, rgba(255,180,80,0.35), transparent 70%)",
              animationDelay: "4s",
            }}
          />
          {EMBERS.map((e, i) => (
            <span
              key={i}
              className="ember"
              style={
                {
                  left: `${e.left}%`,
                  width: `${e.size}px`,
                  height: `${e.size}px`,
                  animationDuration: `${e.duration}s`,
                  animationDelay: `${e.delay}s`,
                  "--drift": `${e.drift}px`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>

        {children}
      </body>
    </html>
  );
}
