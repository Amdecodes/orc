import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { LanguageProvider } from "@/components/LanguageContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "National ID Formatter",
  description: "Professional, print-ready Ethiopian ID formatting in seconds.",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
    other: [
      { rel: "android-chrome-192x192", url: "/android-chrome-192x192.png" },
      { rel: "android-chrome-512x512", url: "/android-chrome-512x512.png" },
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F8FAFC' },
    { media: '(prefers-color-scheme: dark)', color: '#0B0D12' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-bg-page text-text-primary overflow-x-hidden`}>
        <LanguageProvider>
          <Header />
          {children}

          {/* Floating Telegram Support Button */}
          <a
            href="https://t.me/National_ID_Formatter"
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-50 flex items-center justify-center w-14 h-14 bg-[#2AABEE] text-white rounded-full shadow-[0_10px_30px_-5px_rgba(42,171,238,0.8)] hover:shadow-[0_10px_40px_0px_rgba(42,171,238,1)] hover:scale-110 active:scale-95 transition-all duration-300 group ring-4 ring-bg-page"
            aria-label="Contact Support on Telegram"
          >
            <svg 
              className="w-7 h-7" 
              viewBox="0 0 24 24" 
              fill="currentColor"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.69-.52.36-.99.53-1.41.52-.46-.01-1.35-.26-2.01-.48-.81-.27-1.45-.42-1.39-.89.03-.24.36-.49.99-.74 3.86-1.68 6.44-2.78 7.73-3.31 3.67-1.53 4.44-1.8 4.94-1.81.11 0 .36.03.52.16.13.11.17.26.19.37.02.12.02.25.01.38z"/>
            </svg>
            
            <div className="absolute right-full mr-4 px-3 py-2 bg-text-primary text-bg-page text-xs font-black uppercase tracking-wider rounded-xl shadow-xl opacity-0 translate-x-4 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 whitespace-nowrap flex items-center gap-2">
              Support
              <div className="absolute top-1/2 -right-1 -translate-y-1/2 border-[6px] border-transparent border-l-text-primary" />
            </div>
          </a>
        </LanguageProvider>
      </body>
    </html>
  );
}

