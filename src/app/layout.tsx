import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PennyPlan - AI Budget Home Decor",
  description:
    "Get the cheapest, best-quality home decor options with an AI-powered layout engine that parses your hand-drawn sketches.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-stone-50 antialiased">{children}</body>
    </html>
  );
}
