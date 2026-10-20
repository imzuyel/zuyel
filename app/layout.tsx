import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { LoadingProvider } from "@/context/LoadingContext";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "Panchagarh Government Technical School & College ERP",
  description:
    "Comprehensive institutional ERP and smart campus portal for Panchagarh Government Technical School and College (PTSC), Directorate of Technical Education, Bangladesh.",
  openGraph: {
    title: "Panchagarh Government Technical School & College ERP",
    description:
      "Comprehensive institutional ERP and smart campus portal for Panchagarh Government Technical School and College (PTSC), Directorate of Technical Education, Bangladesh.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Panchagarh Government Technical School & College ERP",
    description:
      "Comprehensive institutional ERP and smart campus portal for Panchagarh Government Technical School and College (PTSC), Directorate of Technical Education, Bangladesh.",
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
        className="min-h-screen max-w-full overflow-x-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased selection:bg-indigo-500 selection:text-white transition-colors duration-200"
        suppressHydrationWarning
      >
        <LoadingProvider>
          <AuthProvider>
            <ThemeProvider>
              <LanguageProvider>
                <ToastProvider>{children}</ToastProvider>
              </LanguageProvider>
            </ThemeProvider>
          </AuthProvider>
        </LoadingProvider>
      </body>
    </html>
  );
}
