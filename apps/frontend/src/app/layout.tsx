import type { Metadata, Viewport } from "next";
import { Bai_Jamjuree } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";

// Optimize font loading for Thai language support
const baiJamjuree = Bai_Jamjuree({
  subsets: ["latin", "thai"],
  weight: ["200", "300", "400", "500", "600", "700"],
  variable: "--font-bai-jamjuree",
  display: "swap",
  preload: false, // Disable preload to avoid unused resource warning
});

export const metadata: Metadata = {
  title: "ระบบจัดการฝึกงาน - Internship Management System",
  description: "ระบบจัดการฝึกงานสำหรับนักศึกษา อาจารย์ และผู้ดูแลระบบ",
  keywords: "internship, management, student, instructor, admin, ฝึกงาน",
  authors: [{ name: "Internship Management Team" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Internship System",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#f28362",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <head>
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        
        {/* Font optimization - using swap display instead of preload */}
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        
        {/* Apple touch icon and PWA support */}
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        
        {/* Mobile optimization */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Internship System" />
        
        {/* Prevent automatic phone number detection */}
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body
        className={`${baiJamjuree.variable} font-sans antialiased min-h-screen bg-background text-foreground`}
      >
        <Providers>
          <div id="root" className="relative">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
