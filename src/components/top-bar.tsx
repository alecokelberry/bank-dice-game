"use client";

import React, { useState } from "react";
import { useGameStore, ROUND_EVENTS } from "@/store/game-store";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTitle } from "@/components/ui/dialog";
import { Undo2, RotateCcw, AlertTriangle, Zap, Ghost, Shield, Cloud, Flame, Timer, Star, Bomb, Sparkles } from "lucide-react";

interface TopBarProps {
  onOpenSettings: () => void;
}

export function TopBar({ onOpenSettings }: TopBarProps) {
  const phase = useGameStore((s) => s.phase);
  const undo = useGameStore((s) => s.undo);
  const undoSnapshot = useGameStore((s) => s.undoSnapshot);
  const undoLabel = useGameStore((s) => s.undoLabel);
  const resetGame = useGameStore((s) => s.resetGame);
  const currentRound = useGameStore((s) => s.currentRound);
  const totalRounds = useGameStore((s) => s.totalRounds);
  const rollCount = useGameStore((s) => s.rollCount);

  const [confirmReset, setConfirmReset] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const roundEventsEnabled = useGameStore((s) => s.roundEventsEnabled);
  const activeRoundEventId = useGameStore((s) => s.activeRoundEvent);
  const activeEvent = ROUND_EVENTS.find((e) => e.id === activeRoundEventId);
  const players = useGameStore((s) => s.players);
  const hasGhosts = players.some(p => p.isGhost);

  if (phase === "setup") return null;

  return (
    <>
      <header className="md:hidden sticky top-0 z-30 flex flex-wrap items-center justify-between gap-y-2 px-2 sm:px-4 py-2 bg-gray-950/90 border-b border-white/10 backdrop-blur-xl shadow-sm relative">

        {/* Left Section */}
        <div className="flex items-center gap-2">
          {phase === "playing" && (
            <div className="md:hidden flex items-center gap-3">
              <div className="flex flex-col leading-none">
                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-0.5">Round</span>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-base font-black tabular-nums text-white">{currentRound}</span>
                  <span className="text-xs font-semibold text-gray-500 tabular-nums">/{totalRounds}</span>
                </div>
              </div>
              <div className="w-px h-6 bg-white/10" />
              <div className="flex flex-col leading-none">
                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-0.5">Roll</span>
                <span className="text-base font-black tabular-nums text-white">{rollCount || "—"}</span>
              </div>
            </div>
          )}
        </div>

        {/* Center Section: Round event badge (hidden on desktop — shown in score panel instead) */}
        <div className="absolute left-1/2 -translate-x-1/2 md:hidden">
          {phase === "playing" && roundEventsEnabled && activeEvent && (() => {
            const EVENT_BADGE: Record<string, { icon: React.FC<{className?: string}>; bg: string; text: string; iconColor: string }> = {
              triple_threat:   { icon: Zap,    bg: "bg-amber-500/20 border-amber-500/30",   text: "text-amber-400",  iconColor: "text-amber-400" },
              extended_safety: { icon: Shield, bg: "bg-emerald-500/20 border-emerald-500/30", text: "text-emerald-400", iconColor: "text-emerald-400" },
              ghost_overdrive: { icon: Ghost,  bg: "bg-violet-500/20 border-violet-500/30",  text: "text-violet-400", iconColor: "text-violet-400" },
              heavenly_sevens: { icon: Cloud,  bg: "bg-sky-500/20 border-sky-500/30",        text: "text-sky-400",    iconColor: "text-sky-400" },
              devils_mercy:    { icon: Flame,  bg: "bg-red-500/20 border-red-500/30",        text: "text-red-400",    iconColor: "text-red-400" },
              short_fuse:      { icon: Timer,  bg: "bg-orange-500/20 border-orange-500/30",  text: "text-orange-400", iconColor: "text-orange-400" },
              golden_totals:   { icon: Star,   bg: "bg-yellow-500/20 border-yellow-500/30",  text: "text-yellow-400", iconColor: "text-yellow-400" },
              resilient_bank:  { icon: Shield, bg: "bg-teal-500/20 border-teal-500/30",      text: "text-teal-400",   iconColor: "text-teal-400" },
              time_bomb:       { icon: Bomb,   bg: "bg-rose-500/20 border-rose-500/30",      text: "text-rose-400",   iconColor: "text-rose-400" },
            };
            const ui = EVENT_BADGE[activeEvent.id] ?? EVENT_BADGE.triple_threat;
            const Icon = ui.icon;
            return (
              <button
                type="button"
                onClick={() => setEventModalOpen(true)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider cursor-pointer transition-transform hover:scale-105 ${ui.bg} ${ui.text}`}
              >
                <Icon className={`w-3 h-3 shrink-0 ${ui.iconColor}`} />
                {activeEvent.name}
              </button>
            );
          })()}
        </div>

        {/* Right Section */}
        <div className="flex items-center justify-end gap-0.5 sm:gap-1 ml-auto">
          {phase === "playing" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={undo}
              disabled={!undoSnapshot}
              title={undoSnapshot && undoLabel ? `Undo: ${undoLabel}` : "Undo (Not available)"}
              className={`h-8 w-8 transition-opacity ${!undoSnapshot ? "opacity-30 cursor-not-allowed" : ""}`}
            >
              <Undo2 className="w-4 h-4" />
            </Button>
          )}
          {phase === "playing" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setConfirmReset(true)}
              title="Reset game"
              className="h-8 w-8 sm:h-9 sm:w-9"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          )}
        </div>
      </header>

      {/* Reset confirmation dialog */}
      <Dialog open={confirmReset} onOpenChange={setConfirmReset}>
        <DialogTitle>Reset Game?</DialogTitle>
        <div className="flex items-start gap-3 mb-6">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-gray-300 text-sm">
            This will end the current game and return to the setup screen. All scores will be lost.
          </p>
        </div>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={() => setConfirmReset(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              resetGame();
              setConfirmReset(false);
            }}
          >
            Reset Game
          </Button>
        </div>
      </Dialog>

      {/* Info Modals for setup screen */}
      <Dialog open={eventModalOpen} onOpenChange={setEventModalOpen}>
        <DialogTitle className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-white" />
          Round Events
        </DialogTitle>
        <div className="max-h-[65vh] overflow-y-auto space-y-4 -mx-1 px-1">
          <p className="text-sm text-gray-400 mb-6">
            If enabled, one random event will trigger at the start of each round, modifying the rules for everyone.
          </p>

          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <h3 className="font-bold text-red-400 mb-1 flex items-center gap-2">
              <Flame className="w-4 h-4 text-red-500" /> Devil&apos;s Mercy
            </h3>
            <p className="text-sm text-gray-300">
              The first 7 in the danger zone won&apos;t bust — it just adds 7 and play continues.
            </p>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
            <h3 className="font-bold text-emerald-400 mb-1 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-500" /> Extended Safety
            </h3>
            <p className="text-sm text-gray-300">
              Safe zone runs for 5 rolls this round instead of 3.
            </p>
          </div>

          <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4">
            <h3 className="font-bold text-violet-400 mb-1 flex items-center gap-2">
              <Ghost className="w-4 h-4 text-violet-500" /> Ghost Overdrive
            </h3>
            <p className="text-sm text-gray-300">
              Every ghost rolls twice per turn this round.
            </p>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
            <h3 className="font-bold text-yellow-500 mb-1 flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" /> Golden Totals
            </h3>
            <p className="text-sm text-gray-300">
              Any roll totaling 10, 11, or 12 counts as doubles.
            </p>
          </div>

          <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-4">
            <h3 className="font-bold text-sky-400 mb-1 flex items-center gap-2">
              <Cloud className="w-4 h-4 text-sky-500" /> Heavenly Sevens
            </h3>
            <p className="text-sm text-gray-300">
              7s in the safe zone are worth +140 instead of +70.
            </p>
          </div>

          <div className="bg-teal-500/10 border border-teal-500/20 rounded-xl p-4">
            <h3 className="font-bold text-teal-400 mb-1 flex items-center gap-2">
              <Shield className="w-4 h-4 text-teal-500" /> Brazilian Bank
            </h3>
            <p className="text-sm text-gray-300">
              The first danger-zone 7 halves the bank instead of busting it.
            </p>
          </div>

          <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
            <h3 className="font-bold text-orange-400 mb-1 flex items-center gap-2">
              <Timer className="w-4 h-4 text-orange-500" /> Short Fuse
            </h3>
            <p className="text-sm text-gray-300">
              Safe zone is only 1 roll this round. Danger comes fast.
            </p>
          </div>

          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4">
            <h3 className="font-bold text-rose-400 mb-1 flex items-center gap-2">
              <Bomb className="w-4 h-4 text-rose-500" /> Time Bomb
            </h3>
            <p className="text-sm text-gray-300">
              7 won&apos;t bust this round — but one number between 2 and 12 is secretly rigged to. Roll it in the danger zone and it&apos;s over.
            </p>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
            <h3 className="font-bold text-amber-400 mb-1 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" /> Triple Threat
            </h3>
            <p className="text-sm text-gray-300">
              Hit doubles and the bank triples instead of doubling.
            </p>
          </div>
        </div>
      </Dialog>



    </>
  );
}
