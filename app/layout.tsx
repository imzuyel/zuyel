import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { LoadingProvider } from "@/context/LoadingContext";
import { ToastProvider } from "@/components/ui/Toast";
import { GlobalAcademicProvider } from "@/context/GlobalAcademicContext";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://ptsc.gov.bd"),
  title: {
    default: "পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ (PTSC) | Institutional ERP & Smart Campus",
    template: "%s | পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ",
  },
  description:
    "কারিগরি শিক্ষা অধিদপ্তর ও বিটিইবি (BTEB) অনুমোদিত পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ (PTSC)-এর সার্বিক একাডেমিক ইআরপি, অটোমেশন পোর্টাল ও লাইভ লার্নিং হাব। EIIN: 132244, Institute Code: 18017.",
  keywords: [
    "Panchagarh Government Technical School and College",
    "PTSC",
    "পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ",
    "BTEB Vocational",
    "DTE Technical Education",
    "Institutional ERP Bangladesh",
    "Live Quiz Arena",
    "Student Portal",
  ],
  authors: [{ name: "Panchagarh Govt. Technical School & College" }],
  openGraph: {
    title: "পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ (PTSC) | Institutional ERP & Smart Campus",
    description:
      "কারিগরি শিক্ষা অধিদপ্তর ও বিটিইবি (BTEB) অনুমোদিত পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ (PTSC)-এর সার্বিক একাডেমিক ইআরপি ও স্মার্ট ক্যাম্পাস পোর্টাল।",
    type: "website",
    locale: "bn_BD",
  },
  twitter: {
    card: "summary_large_image",
    title: "Panchagarh Government Technical School & College (PTSC) ERP",
    description:
      "Comprehensive institutional ERP, live quiz arena and smart campus portal for Panchagarh Govt Technical School and College (EIIN 132244).",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=localStorage.getItem('pgtsc_theme_mode');if(m==='dark'||(!m&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');document.documentElement.setAttribute('data-mode','dark');}else{document.documentElement.classList.remove('dark');document.documentElement.setAttribute('data-mode','light');}}catch(e){}try{window.addEventListener('error',function(e){if(e&&e.message&&(/Loading chunk .* failed/i.test(e.message)||/ChunkLoadError/i.test(e.message))){var k='ptsc_chunk_recov';if(!sessionStorage.getItem(k)){sessionStorage.setItem(k,Date.now());window.location.reload();}}});window.addEventListener('unhandledrejection',function(e){if(e&&e.reason&&((e.reason.message&&/Loading chunk .* failed/i.test(e.reason.message))||(e.reason.name&&/ChunkLoadError/i.test(e.reason.name)))){var k='ptsc_chunk_recov';if(!sessionStorage.getItem(k)){sessionStorage.setItem(k,Date.now());window.location.reload();}}});}catch(err){}})();`,
          }}
        />
      </head>
      <body
        className="min-h-screen max-w-full overflow-x-clip bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased selection:bg-indigo-500 selection:text-white transition-colors duration-200"
        suppressHydrationWarning
      >
        <LoadingProvider>
          <AuthProvider>
            <ThemeProvider>
              <LanguageProvider>
                <GlobalAcademicProvider>
                  <ToastProvider>{children}</ToastProvider>
                </GlobalAcademicProvider>
              </LanguageProvider>
            </ThemeProvider>
          </AuthProvider>
        </LoadingProvider>
      </body>
    </html>
  );
}
