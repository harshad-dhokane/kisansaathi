import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KisanSaathi",
  description:
    "A guardrailed agriculture advisory chatbot with a Vercel-ready chat UI and CeRAI-compatible evaluation endpoint.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
