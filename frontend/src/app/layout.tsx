import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "../../context/LanguageContext";
import { LanguageSwitcher } from "../../components/LanguageSwitcher";

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
      className="h-full antialiased font-sans"
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
