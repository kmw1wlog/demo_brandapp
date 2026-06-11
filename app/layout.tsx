import type { Metadata } from "next";
import { AnalyticsBootstrap } from "@/components/analytics/AnalyticsBootstrap";
import "./globals.css";

export const metadata: Metadata = {
  title: "브랜치",
  description: "프랜차이즈와 자가 브랜드 창업안을 비교하는 오픈채팅 체험데모"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <AnalyticsBootstrap />
        {children}
      </body>
    </html>
  );
}
