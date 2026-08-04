"use client";

import Script from "next/script";

export default function LegacyDashboardScripts() {
  return (
    <Script
      src="/legacy-app.js"
      strategy="afterInteractive"
      onReady={() => { window.dispatchEvent(new Event("load")); }}
    />
  );
}
