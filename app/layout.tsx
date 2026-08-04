import type { Metadata } from "next";
import Script from "next/script";
import "../style.css";
import "./version-management.css";
import UpdateChecker from "./components/UpdateChecker";

export const metadata: Metadata = {
  title: "Preventive Maintenance System - CMMS Dashboard",
  description: "Preventive maintenance and SCADA dashboard for PT. Dankosfarma"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className="predictacore-theme">
        {children}
        <UpdateChecker />
        <Script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js" strategy="beforeInteractive" />
        <Script src="/assets/logo_data.js" strategy="beforeInteractive" />
      </body>
    </html>
  );
}
