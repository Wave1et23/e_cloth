import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "衣橱镜像 · 给现实衣柜建一份数字档案",
  description:
    "拍一件衣服，AI 帮你填好属性；打印二维码贴到衣架上，手机相机扫一下就能记录今天穿了什么。",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F7F1E3",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
