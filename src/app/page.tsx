"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore, selectIsInDangerZone, selectCanBank, selectCurrentRoller, selectCanRoll, getTurnOrder } from "@/store/game-store";
import { Dices, Landmark } from "lucide-react";
import { playRollSound, playBankSound, triggerHaptic, primeAudio } from "@/lib/sounds";
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
  const canBank = useGameStore(selectCanBank);
  const canRoll = useGameStore(selectCanRoll);
  const currentRoller = useGameStore(selectCurrentRoller);
  const autoRollGhost = useGameStore((s) => s.autoRollGhost);
  const players = useGameStore((s) => s.players);
  const bankedThisRound = useGameStore((s) => s.bankedThisRound);
  const handleBank = useGameStore((s) => s.handleBank);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [rollOpen, setRollOpen] = useState(false);
  const [bankOpen, setBankOpen] = useState(false);
  const [selectedBankIds, setSelectedBankIds] = useState<string[]>([]);

  // Reset bank selection when sheet opens
  useEffect(() => {
    if (bankOpen) setSelectedBankIds([]);
  }, [bankOpen]);

  // Auto-close roll sheet on bust
  useEffect(() => {
    if (isBust) setRollOpen(false);
  }, [isBust]);

  // Ghost auto-roll — lives here so it runs even when the roll sheet is closed.
  // After each ghost roll, reads fresh store state to chain another roll if the next
  // turn slot is also a ghost (handles Ghost Overdrive's double-roll correctly).
  const isAutoRollingRef = useRef(false);
  useEffect(() => {
    if (phase !== "playing" || isBust || !currentRoller?.isGhost) return;
    if (isAutoRollingRef.current) return;

    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const doGhostRoll = () => {
      isAutoRollingRef.current = true;
      const t1 = setTimeout(() => {
        if (cancelled) return;
        playRollSound();
        triggerHaptic("medium");
        const t2 = setTimeout(() => {
          if (cancelled) return;
          autoRollGhost();
          // Read fresh state — if the next turn slot is also a ghost, chain another roll
          const s = useGameStore.getState();
          const order = getTurnOrder(s.players, s.activeRoundEvent, s.currentRound, s.ghostsActiveUntilRound);
          const next = order[s.currentRollerIndex % order.length];
          if (next?.isGhost && s.phase === "playing" && !s.isBust) {
            doGhostRoll();
          } else {
            isAutoRollingRef.current = false;
          }
        }, 300);
        timers.push(t2);
      }, 1000);
      timers.push(t1);
    };

    doGhostRoll();

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      isAutoRollingRef.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, isBust, currentRoller, autoRollGhost]);

  const bankablePlayers = players.filter((p) => !p.isGhost && !bankedThisRound.includes(p.id));

  const toggleBankPlayer = (id: string) =>
    setSelectedBankIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const confirmBank = () => {
    selectedBankIds.forEach((id) => {
      playBankSound();
      triggerHaptic("light");
      handleBank(id);
    });
    setBankOpen(false);
  };

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
      className="min-h-screen text-white flex flex-col bg-gray-950"
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
        <>
          {/* Main screen — leaderboard */}
          <div className="flex-1 flex flex-col pb-24 overflow-auto">
            <div className="flex items-center justify-center h-44 px-4">
              <BankDisplay />
            </div>
            <div className="px-4 flex-1">
              <PlayerList mode="leaderboard" />
            </div>
          </div>

          {/* Fixed bottom action bar */}
          <div className="fixed bottom-0 left-0 right-0 z-30 flex gap-3 p-4 bg-gray-950/90 backdrop-blur-xl border-t border-white/10">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => { primeAudio(); setRollOpen(true); }}
              className="flex-1 h-14 flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg shadow-lg shadow-indigo-600/25 transition-colors cursor-pointer"
            >
              <Dices className="w-5 h-5" />
              Roll
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setBankOpen(true)}
              disabled={!canBank}
              className="flex-1 h-14 flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg shadow-lg shadow-emerald-600/25 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Landmark className="w-5 h-5" />
              Bank
            </motion.button>
          </div>

          {/* Roll bottom sheet */}
          <AnimatePresence>
            {rollOpen && (
              <motion.div
                className="fixed inset-0 z-40 flex flex-col justify-end"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="absolute inset-0 bg-black/50"
                  onClick={() => setRollOpen(false)}
                />
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 30, stiffness: 350 }}
                  className="relative z-10 bg-gray-950 rounded-t-3xl pt-4 pb-10 px-2 flex flex-col items-center gap-4"
                >
                  <div className="w-10 h-1 bg-white/20 rounded-full" />
                  <RollControls />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bank bottom sheet */}
          <AnimatePresence>
            {bankOpen && (
              <motion.div
                className="fixed inset-0 z-40 flex flex-col justify-end"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="absolute inset-0 bg-black/50"
                  onClick={() => setBankOpen(false)}
                />
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 30, stiffness: 350 }}
                  className="relative z-10 bg-gray-950 rounded-t-3xl pt-4 pb-10 px-4"
                >
                  <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />
                  {bankablePlayers.length === 0 ? (
                    <p className="text-center text-gray-500 py-6">All players have banked this round</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {bankablePlayers.map((player) => {
                        const isSelected = selectedBankIds.includes(player.id);
                        return (
                          <motion.button
                            key={player.id}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => toggleBankPlayer(player.id)}
                            className={`flex flex-col items-center justify-center py-4 rounded-2xl font-bold text-base transition-all duration-150 border-2 ${
                              isSelected
                                ? "text-white shadow-lg scale-[1.03] border-transparent"
                                : "text-white/80 border-transparent"
                            }`}
                            style={{
                              backgroundColor: isSelected
                                ? player.color
                                : `${player.color}55`,
                              boxShadow: isSelected ? `0 4px 20px ${player.color}55` : undefined,
                            }}
                          >
                            <span className="truncate">{player.name}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                  )}
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={confirmBank}
                    disabled={selectedBankIds.length === 0}
                    className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    <Landmark className="w-5 h-5" />
                    Bank
                  </motion.button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {phase === "finished" && <WinnerScreen />}

      <BustOverlay />
      <RoundSummary />

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </main>
  );
}
