"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore, selectIsInDangerZone, selectCanBank, selectCurrentRoller, selectCanRoll, getTurnOrder, ROUND_EVENTS } from "@/store/game-store";
import { Dices, Landmark, Zap, Ghost, Shield, Cloud, Flame, Timer, Star, Bomb, Undo2, RotateCcw, AlertTriangle, Maximize2, Minimize2 } from "lucide-react";
import type { ComponentType } from "react";

const EVENT_PANEL_STYLES: Record<string, { icon: ComponentType<{className?: string}>; bg: string; text: string; iconColor: string }> = {
  triple_threat:   { icon: Zap,    bg: "bg-amber-500/20 border-amber-500/30",    text: "text-amber-400",  iconColor: "text-amber-400" },
  extended_safety: { icon: Shield, bg: "bg-emerald-500/20 border-emerald-500/30", text: "text-emerald-400", iconColor: "text-emerald-400" },
  ghost_overdrive: { icon: Ghost,  bg: "bg-violet-500/20 border-violet-500/30",   text: "text-violet-400", iconColor: "text-violet-400" },
  heavenly_sevens: { icon: Cloud,  bg: "bg-sky-500/20 border-sky-500/30",          text: "text-sky-400",    iconColor: "text-sky-400" },
  devils_mercy:    { icon: Flame,  bg: "bg-red-500/20 border-red-500/30",          text: "text-red-400",    iconColor: "text-red-400" },
  short_fuse:      { icon: Timer,  bg: "bg-orange-500/20 border-orange-500/30",    text: "text-orange-400", iconColor: "text-orange-400" },
  golden_totals:   { icon: Star,   bg: "bg-yellow-500/20 border-yellow-500/30",    text: "text-yellow-400", iconColor: "text-yellow-400" },
  resilient_bank:  { icon: Shield, bg: "bg-teal-500/20 border-teal-500/30",        text: "text-teal-400",   iconColor: "text-teal-400" },
  time_bomb:       { icon: Bomb,   bg: "bg-rose-500/20 border-rose-500/30",        text: "text-rose-400",   iconColor: "text-rose-400" },
};
import { playRollSound, playBankSound, triggerHaptic, primeAudio } from "@/lib/sounds";
import { TopBar } from "@/components/top-bar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTitle } from "@/components/ui/dialog";
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
  const currentRound = useGameStore((s) => s.currentRound);
  const totalRounds = useGameStore((s) => s.totalRounds);
  const rollCount = useGameStore((s) => s.rollCount);
  const roundEventsEnabled = useGameStore((s) => s.roundEventsEnabled);
  const activeRoundEvent = useGameStore((s) => s.activeRoundEvent);
  const activeEvent = ROUND_EVENTS.find((e) => e.id === activeRoundEvent);
  const undo = useGameStore((s) => s.undo);
  const undoSnapshot = useGameStore((s) => s.undoSnapshot);
  const undoLabel = useGameStore((s) => s.undoLabel);
  const resetGame = useGameStore((s) => s.resetGame);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [rollOpen, setRollOpen] = useState(false);
  const [bankOpen, setBankOpen] = useState(false);
  const [selectedBankIds, setSelectedBankIds] = useState<string[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen();
  };

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
          const order = getTurnOrder(s.players, s.activeRoundEvent);
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
          {/* Mobile: bank at top then players; Desktop/TV: players left (1/2), score panel right (1/2) */}
          <div className="flex-1 flex flex-col md:flex-row overflow-auto md:overflow-hidden">

            {/* Left panel */}
            <div className="flex-1 md:flex-none md:w-1/2 flex flex-col md:overflow-hidden">
              {/* Mobile-only bank display */}
              <div className="md:hidden flex items-center justify-center h-44 px-4">
                <BankDisplay />
              </div>
              {/* Player list — single centered column */}
              <div className="flex-1 px-4 pb-24 md:px-8 xl:px-12 md:pb-0 md:overflow-y-auto md:[scrollbar-width:none] md:[&::-webkit-scrollbar]:hidden md:flex md:flex-col md:justify-center">
                <div className="md:max-w-full">
                  <PlayerList mode="leaderboard" />
                </div>
              </div>
            </div>

            {/* Right: Score panel — desktop/TV only */}
            <div className="hidden md:flex md:w-1/2 flex-col items-center justify-center gap-3 xl:gap-5 px-10 xl:px-16 border-l border-white/10 relative">
              {/* Undo + Reset + Fullscreen — top-right of panel */}
              <div className="absolute top-4 right-4 flex gap-1">
                <Button
                  variant="ghost" size="icon"
                  onClick={undo}
                  disabled={!undoSnapshot}
                  title={undoSnapshot && undoLabel ? `Undo: ${undoLabel}` : "Nothing to undo"}
                  className={`h-9 w-9 transition-opacity ${!undoSnapshot ? "opacity-30 cursor-not-allowed" : ""}`}
                >
                  <Undo2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost" size="icon"
                  onClick={() => setConfirmReset(true)}
                  title="Reset game"
                  className="h-9 w-9"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost" size="icon"
                  onClick={toggleFullscreen}
                  title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                  className="h-9 w-9"
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>
              </div>

              {/* Round event badge */}
              {roundEventsEnabled && activeEvent && (() => {
                const ui = EVENT_PANEL_STYLES[activeEvent.id] ?? EVENT_PANEL_STYLES.triple_threat;
                const Icon = ui.icon;
                return (
                  <button
                    type="button"
                    onClick={() => setEventModalOpen(true)}
                    className={`flex items-center gap-3 xl:gap-4 px-6 xl:px-8 py-3 xl:py-4 rounded-2xl border cursor-pointer transition-transform hover:scale-105 ${ui.bg} ${ui.text}`}
                  >
                    <Icon className={`w-7 h-7 xl:w-10 xl:h-10 shrink-0 ${ui.iconColor}`} />
                    <span className="text-xl xl:text-3xl font-black uppercase tracking-widest">{activeEvent.name}</span>
                  </button>
                );
              })()}

              {/* Bank score */}
              <BankDisplay />

              {/* Round + Roll counters */}
              <div className="flex items-center gap-8 xl:gap-14 px-8 xl:px-12 py-3 xl:py-5 rounded-2xl bg-white/5 border border-white/[0.06]">
                <div className="text-center">
                  <div className="text-[10px] xl:text-xs font-bold uppercase tracking-widest text-gray-500 mb-0.5">Round</div>
                  <div className="text-4xl xl:text-6xl 2xl:text-7xl font-black text-white tabular-nums leading-none">
                    {currentRound}<span className="text-xl xl:text-3xl text-gray-600 font-bold">/{totalRounds}</span>
                  </div>
                </div>
                <div className="w-px h-10 xl:h-16 bg-white/10" />
                <div className="text-center">
                  <div className="text-[10px] xl:text-xs font-bold uppercase tracking-widest text-gray-500 mb-0.5">Roll</div>
                  <div className="text-4xl xl:text-6xl 2xl:text-7xl font-black text-white tabular-nums leading-none">{rollCount || "—"}</div>
                </div>
              </div>

              {/* Whose turn */}
              <div className="flex items-center gap-2.5 xl:gap-4 px-5 xl:px-7 py-2.5 xl:py-3.5 rounded-full bg-white/5 border border-white/[0.08]">
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                  transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
                  className="w-2.5 h-2.5 xl:w-4 xl:h-4 rounded-full shrink-0"
                  style={{ backgroundColor: currentRoller?.color }}
                />
                <span className="font-black text-xl xl:text-3xl 2xl:text-4xl" style={{ color: currentRoller?.color }}>
                  {currentRoller?.isGhost ? "Ghost" : currentRoller?.name}
                </span>
                <span className="text-lg xl:text-2xl 2xl:text-3xl text-gray-500">'s Roll</span>
              </div>

              {/* Dice entry — always visible on desktop */}
              <RollControls />

              {/* Bank button */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setBankOpen(true)}
                disabled={!canBank}
                className="w-full max-w-sm xl:max-w-xl 2xl:max-w-2xl h-12 xl:h-16 2xl:h-20 flex items-center justify-center gap-2 xl:gap-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg xl:text-2xl 2xl:text-3xl transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Landmark className="w-5 h-5 xl:w-7 xl:h-7" />
                Bank
              </motion.button>
            </div>
          </div>

          {/* Mobile bottom bar — Roll + Bank buttons */}
          <div className="md:hidden fixed bottom-0 inset-x-0 z-20 flex gap-3 px-4 py-3 bg-gray-950/95 border-t border-white/10 backdrop-blur-xl">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => { primeAudio(); setRollOpen(true); }}
              disabled={isBust || !canRoll}
              className="flex-1 h-14 flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <Dices className="w-5 h-5" />
              Roll
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setBankOpen(true)}
              disabled={!canBank}
              className="flex-1 h-14 flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
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
                {/* Gradient backdrop: transparent at top so bank stays bright, fades in toward sheet */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent"
                  onClick={() => setRollOpen(false)}
                />
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 30, stiffness: 350 }}
                  className="relative z-10 bg-gray-950 rounded-t-3xl pt-4 pb-10 px-2 flex flex-col items-center gap-3"
                >
                  <div className="w-10 h-1 bg-white/20 rounded-full" />
                  {/* Whose roll it is */}
                  <div className="w-full text-center">
                    <span className="font-black text-2xl" style={{ color: currentRoller?.color }}>
                      {currentRoller?.isGhost ? "Ghost" : currentRoller?.name}
                    </span>
                    <span className="text-xl text-gray-400 ml-1">'s Roll</span>
                  </div>
                  <RollControls />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bank bottom sheet */}
          <AnimatePresence>
            {bankOpen && (
              <motion.div
                className="fixed inset-0 md:left-1/2 z-40 flex flex-col justify-end"
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
                            whileTap={{ scale: 0.97 }}
                            onClick={() => toggleBankPlayer(player.id)}
                            className="flex items-center justify-center py-5 rounded-2xl text-3xl font-bold text-white transition-all duration-150 border"
                            style={{
                              backgroundColor: isSelected ? player.color : player.color + "55",
                              borderColor: isSelected ? player.color : player.color + "cc",
                              boxShadow: isSelected ? `0 0 28px ${player.color}99` : undefined,
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

      {/* Desktop event info modal */}
      {activeEvent && (
        <Dialog open={eventModalOpen} onOpenChange={setEventModalOpen}>
          <DialogTitle className="mb-2">{activeEvent.name}</DialogTitle>
          <p className="text-sm text-gray-300">{activeEvent.description}</p>
        </Dialog>
      )}

      {/* Desktop reset confirmation */}
      <Dialog open={confirmReset} onOpenChange={setConfirmReset}>
        <DialogTitle>Reset Game?</DialogTitle>
        <div className="flex items-start gap-3 mb-6">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-gray-300 text-sm">This will end the current game and return to the setup screen. All scores will be lost.</p>
        </div>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={() => setConfirmReset(false)}>Cancel</Button>
          <Button variant="destructive" onClick={() => { resetGame(); setConfirmReset(false); }}>Reset Game</Button>
        </div>
      </Dialog>
    </main>
  );
}
