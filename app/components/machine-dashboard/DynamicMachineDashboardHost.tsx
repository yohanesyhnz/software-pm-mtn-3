"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import DynamicMachineDashboard from "./DynamicMachineDashboard";

export default function DynamicMachineDashboardHost() {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { refetchOnWindowFocus: false } },
  }));

  useEffect(() => {
    const element = document.getElementById("dashboard-machine-status-grid");
    if (element) {
      element.dataset.reactDashboard = "true";
      element.replaceChildren();
      setTarget(element);
    }
  }, []);

  if (!target) return null;
  return createPortal(
    <QueryClientProvider client={queryClient}>
      <DynamicMachineDashboard />
    </QueryClientProvider>,
    target,
  );
}
