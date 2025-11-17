import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SageSure Social - Social Media Management",
  description: "Manage all your social media accounts in one place",
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
