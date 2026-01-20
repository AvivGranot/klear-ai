import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

// Aman-inspired typography (PRD)
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Klear AI - Internal Knowledge Assistant",
  description: "AI-powered internal knowledge hub for SMB retail chains. Transform repetitive employee questions into instant, visual answers.",
  keywords: ["AI", "knowledge base", "WhatsApp", "retail", "SMB", "employee training", "Hebrew"],
  authors: [{ name: "Aviv Granot" }, { name: "Nevo Peretz" }, { name: "Dana Mordoh" }],
  openGraph: {
    title: "Klear AI - Internal Knowledge Assistant",
    description: "AI-powered internal knowledge hub for SMB retail chains",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${inter.variable} ${cormorant.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
