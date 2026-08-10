"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import SmartAssistantRobot, { type RobotFlight } from "./SmartAssistantRobot";
import SmartAssistantSettings from "./SmartAssistantSettings";
import { useSmartAssistantData } from "./useSmartAssistantData";

const SmartAssistantDialog = dynamic(() => import("./SmartAssistantDialog"), {
  ssr: false,
  loading: () => null
});

const AUTHENTICATED_EVENT = "predictacore:authenticated";
const LOGOUT_EVENT = "predictacore:logout";

type AuthenticatedEventDetail = {
  user?: {
    username?: string;
  };
};

function readActiveUsername() {
  try {
    const saved = window.localStorage.getItem("pm_active_user");
    const user = saved ? JSON.parse(saved) as { username?: string } : null;
    return user?.username?.trim() || "default";
  } catch {
    return "default";
  }
}

export default function SmartAssistantHost() {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { retry: 2 }
    }
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <SmartAssistantController />
    </QueryClientProvider>
  );
}

function SmartAssistantController() {
  const reducedMotion = useReducedMotion();
  const bellRef = useRef<HTMLButtonElement>(null);
  const dialogTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoShown = useRef(false);
  const [bellSlot, setBellSlot] = useState<HTMLElement | null>(null);
  const [settingsSlot, setSettingsSlot] = useState<HTMLElement | null>(null);
  const [username, setUsername] = useState("default");
  const [authenticatedSequence, setAuthenticatedSequence] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [robotVisible, setRobotVisible] = useState(false);
  const [robotReturning, setRobotReturning] = useState(false);
  const [bellTravelling, setBellTravelling] = useState(false);
  const [flight, setFlight] = useState<RobotFlight | null>(null);

  const {
    snapshot,
    notificationsLoading,
    preferences,
    preferencesLoading,
    connectionState,
    updatePreferences
  } = useSmartAssistantData(username);

  useEffect(() => {
    setBellSlot(document.getElementById("smart-assistant-bell-slot"));
    setSettingsSlot(document.getElementById("smart-assistant-settings-root"));
    setUsername(readActiveUsername());
  }, []);

  const closeAssistant = useCallback(() => {
    if (dialogTimer.current) {
      clearTimeout(dialogTimer.current);
      dialogTimer.current = null;
    }
    setDialogOpen(false);
    setBellTravelling(false);
    if (robotVisible && flight && preferences.enableRobotAnimation && !reducedMotion) {
      setRobotReturning(true);
    } else {
      setRobotVisible(false);
      setRobotReturning(false);
    }
  }, [flight, preferences.enableRobotAnimation, reducedMotion, robotVisible]);

  const openAssistant = useCallback(() => {
    if (!preferences.enableSmartAssistant) return;

    if (dialogTimer.current) clearTimeout(dialogTimer.current);
    const shouldAnimateRobot = preferences.enableRobotAnimation && !reducedMotion && bellRef.current;

    if (!shouldAnimateRobot) {
      setRobotVisible(false);
      setDialogOpen(true);
      return;
    }

    const rect = bellRef.current!.getBoundingClientRect();
    const size = window.innerWidth < 640 ? 104 : 138;
    setFlight({
      startX: rect.left + rect.width / 2 - size / 2,
      startY: rect.top + rect.height / 2 - size / 2,
      endX: window.innerWidth / 2 - size / 2,
      endY: Math.max(74, window.innerHeight / 2 - size * 1.65),
      size
    });
    setRobotReturning(false);
    setRobotVisible(true);
    setBellTravelling(true);
    dialogTimer.current = setTimeout(() => {
      setDialogOpen(true);
      setBellTravelling(false);
      dialogTimer.current = null;
    }, 820);
  }, [preferences.enableRobotAnimation, preferences.enableSmartAssistant, reducedMotion]);

  useEffect(() => {
    const onAuthenticated = (event: Event) => {
      const detail = (event as CustomEvent<AuthenticatedEventDetail>).detail;
      setUsername(detail?.user?.username?.trim() || readActiveUsername());
      autoShown.current = false;
      setAuthenticatedSequence((sequence) => sequence + 1);
    };
    const onLogout = () => {
      autoShown.current = false;
      setUsername("default");
      closeAssistant();
    };

    window.addEventListener(AUTHENTICATED_EVENT, onAuthenticated);
    window.addEventListener(LOGOUT_EVENT, onLogout);
    return () => {
      window.removeEventListener(AUTHENTICATED_EVENT, onAuthenticated);
      window.removeEventListener(LOGOUT_EVENT, onLogout);
    };
  }, [closeAssistant]);

  useEffect(() => {
    if (authenticatedSequence === 0 || autoShown.current || notificationsLoading || preferencesLoading) return;
    autoShown.current = true;

    if (
      snapshot.total > 0 &&
      preferences.enableSmartAssistant &&
      preferences.enableAutoPopup
    ) {
      openAssistant();
    }
  }, [
    authenticatedSequence,
    notificationsLoading,
    openAssistant,
    preferences.enableAutoPopup,
    preferences.enableSmartAssistant,
    preferencesLoading,
    snapshot.total
  ]);

  useEffect(() => {
    if (!preferences.enableSmartAssistant && (dialogOpen || robotVisible)) closeAssistant();
  }, [closeAssistant, dialogOpen, preferences.enableSmartAssistant, robotVisible]);

  useEffect(() => () => {
    if (dialogTimer.current) clearTimeout(dialogTimer.current);
  }, []);

  function navigateTo(tabName: "spareparts" | "history") {
    closeAssistant();
    window.setTimeout(() => window.switchTab?.(tabName), reducedMotion ? 0 : 180);
  }

  const severityClass = snapshot.highestSeverity === "CRITICAL"
    ? "smart-assistant-bell-critical"
    : snapshot.highestSeverity === "WARNING"
      ? "smart-assistant-bell-warning"
      : "smart-assistant-bell-normal";

  const bell = bellSlot ? createPortal(
    <motion.button
      ref={bellRef}
      type="button"
      onClick={openAssistant}
      disabled={!preferences.enableSmartAssistant}
      aria-label={snapshot.total > 0
        ? `Buka Smart Maintenance Assistant, ${snapshot.total} notifikasi aktif`
        : "Buka Smart Maintenance Assistant, tidak ada notifikasi aktif"}
      aria-haspopup="dialog"
      title={preferences.enableSmartAssistant ? "Smart Maintenance Assistant" : "Smart Assistant dinonaktifkan di Settings"}
      className="tw-relative tw-flex tw-h-10 tw-w-10 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-slate-500/20 tw-bg-slate-500/10 tw-transition hover:tw-border-cyan-400/40 hover:tw-bg-cyan-400/10 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-cyan-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-50"
      animate={bellTravelling ? { rotate: [0, -13, 12, -10, 8, -4, 0], scale: [1, 1.06, 1] } : { rotate: 0, scale: 1 }}
      transition={{ duration: 0.62, ease: "easeInOut" }}
    >
      <span className={severityClass} aria-hidden="true">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M10 21h4" />
        </svg>
      </span>
      {snapshot.total > 0 && (
        <span className="tw-absolute -tw-right-1.5 -tw-top-1.5 tw-flex tw-h-5 tw-min-w-5 tw-items-center tw-justify-center tw-rounded-full tw-border-2 tw-border-slate-950 tw-bg-red-500 tw-px-1 tw-text-[10px] tw-font-black tw-leading-none tw-text-white" aria-live="polite">
          {snapshot.total > 99 ? "99+" : snapshot.total}
        </span>
      )}
    </motion.button>,
    bellSlot
  ) : null;

  const settings = settingsSlot ? createPortal(
    <SmartAssistantSettings
      preferences={preferences}
      connectionState={connectionState}
      source={snapshot.source}
      onChange={updatePreferences}
      onLogout={() => window.predictaCoreLogout?.()}
    />,
    settingsSlot
  ) : null;

  return (
    <>
      {bell}
      {settings}

      <AnimatePresence>
        {robotVisible && flight && (
          <SmartAssistantRobot
            key="smart-assistant-robot"
            flight={flight}
            returning={robotReturning}
            onReturnComplete={() => {
              setRobotVisible(false);
              setRobotReturning(false);
            }}
          />
        )}
      </AnimatePresence>

      {dialogOpen && (
        <SmartAssistantDialog
          open={dialogOpen}
          snapshot={snapshot}
          connectionState={connectionState}
          onOpenChange={(open) => {
            if (!open) closeAssistant();
          }}
          onViewLifetime={() => navigateTo("spareparts")}
          onSchedulePm={() => navigateTo("history")}
        />
      )}
    </>
  );
}
