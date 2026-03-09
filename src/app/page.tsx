"use client";

import { useState, useEffect } from "react";
import { useGameStore, selectIsInDangerZone } from "@/store/game-store";
import { TopBar } from "@/components/top-bar";
import { SetupScreen } from "@/components/setup-screen";
import { BankDisplay } from "@/components/bank-display";
import { RollControls } from "@/components/roll-controls";
import { PlayerList } from "@/components/player-list";
import { SettingsDialog } from "@/components/settings-dialog";
import { WinnerScreen } from "@/components/winner-screen";
import { BustOverlay } from "@/components/bust-overlay";
import { RoundSummary } from "@/components/round-summary";
import { Toaster } from "sonner";

export default function Home() {
  const phase = useGameStore((s) => s.phase);
  const isDanger = useGameStore(selectIsInDangerZone);
  const isBust = useGameStore((s) => s.isBust);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Prevent hydration mismatches from persisted localStorage state.
  // This is a standard Next.js pattern — the lint warning is a false positive.
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-500 text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <main
      className="min-h-screen text-white flex flex-col transition-colors duration-700 bg-gray-950"
      style={{
        backgroundImage:
          phase === "playing" && isDanger && !isBust
            ? "radial-gradient(ellipse at center bottom, rgba(245,158,11,0.06) 0%, transparent 60%)"
            : phase === "playing"
              ? "radial-gradient(ellipse at center bottom, rgba(99,102,241,0.04) 0%, transparent 60%)"
              : "none",
      }}
    >
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "#1f2937",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.1)",
          },
        }}
      />

      <TopBar onOpenSettings={() => setSettingsOpen(true)} />

      {phase === "setup" && <SetupScreen />}

      {phase === "playing" && (
        <div className="flex-1 flex flex-col lg:flex-row">
          {/* Main game area: bank value and roll controls */}
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-4 sm:p-6">
            <BankDisplay />
            <RollControls />
          </div>

          {/* Sidebar: player list with bank buttons */}
          <div className="lg:w-80 lg:border-l border-t lg:border-t-0 border-white/10 p-4 lg:p-6 bg-white/[0.02]">
            <PlayerList />
          </div>
        </div>
      )}

      {phase === "finished" && <WinnerScreen />}

      <BustOverlay />
      <RoundSummary />

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </main>
  );
}
