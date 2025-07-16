import "./globals.css";
// In app/layout.tsx or a root-level component
import { Toaster } from "sonner";

import { Anonymous_Pro, Fira_Mono } from "next/font/google";
const firaMono = Fira_Mono({
  weight: ["400", "500", "700"],
  style: ["normal"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fira-mono",
});

const anonymousPro = Anonymous_Pro({
  weight: ["400", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-anonymous-pro",
});

export const metadata = {
  title: "Convo",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {children}
        {typeof window !== "undefined" &&
          require("@/app/ToastProvider").default()}
        <Toaster richColors position="top-right" /> {/* Required */}
      </body>
    </html>
  );
}
