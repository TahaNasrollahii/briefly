import type { Metadata } from "next";
import { Geist, Geist_Mono, Vazirmatn } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "../../context/LanguageContext";
import { LanguageSwitcher } from "../../components/LanguageSwitcher";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const vazirmatn = Vazirmatn({
  variable: "--font-vazirmatn",
  subsets: ["arabic"],
});

export const metadata: Metadata = {
  title: "Briefly AI",
  description: "Next-Gen Audio Intelligence",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${vazirmatn.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col relative">
        <LanguageProvider>
          <div className="absolute top-6 right-6 sm:top-10 sm:right-10 z-50">
            <LanguageSwitcher />
          </div>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
