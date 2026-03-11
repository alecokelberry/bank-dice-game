"use client";

import { useState, useCallback } from "react";
import { useGameStore, selectIsInDangerZone, selectCanRoll, ROUND_EVENTS } from "@/store/game-store";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTitle } from "@/components/ui/dialog";
import { DicePair } from "@/components/dice";
import { Undo2, RotateCcw, AlertTriangle, Dices, Sun, Moon, Zap, Ghost, Shield, Cloud, Flame, Timer, Star, Bomb, Trophy, Sparkles } from "lucide-react";
import { playRollSound, triggerHaptic } from "@/lib/sounds";
import { useTheme } from "@/components/theme-provider";

interface TopBarProps {
  onOpenSettings: () => void;
}

export function TopBar({ onOpenSettings }: TopBarProps) {
  const currentRound = useGameStore((s) => s.currentRound);
  const totalRounds = useGameStore((s) => s.totalRounds);
  const rollCount = useGameStore((s) => s.rollCount);
  const phase = useGameStore((s) => s.phase);
  const undo = useGameStore((s) => s.undo);
  const undoSnapshot = useGameStore((s) => s.undoSnapshot);
  const undoLabel = useGameStore((s) => s.undoLabel);
  const resetGame = useGameStore((s) => s.resetGame);
  const isDanger = useGameStore(selectIsInDangerZone);
  const handleRoll = useGameStore((s) => s.handleRoll);
  const canRoll = useGameStore(selectCanRoll);
  const lastDie1 = useGameStore((s) => s.lastDie1);
  const lastDie2 = useGameStore((s) => s.lastDie2);
  const isBust = useGameStore((s) => s.isBust);

  const [confirmReset, setConfirmReset] = useState(false);
  const [virtualDiceOpen, setVirtualDiceOpen] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [ghostModalOpen, setGhostModalOpen] = useState(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const roundEventsEnabled = useGameStore((s) => s.roundEventsEnabled);
  const activeRoundEventId = useGameStore((s) => s.activeRoundEvent);
  const activeEvent = ROUND_EVENTS.find((e) => e.id === activeRoundEventId);
  const players = useGameStore((s) => s.players);
  const hasGhosts = players.some(p => p.isGhost);

  // Theme support
  const { theme, toggleTheme } = useTheme();

  // Generates two random dice and submits the roll after a short animation delay
  const rollVirtual = useCallback(() => {
    if (!canRoll || isRolling) return;
    setIsRolling(true);
    playRollSound();
    triggerHaptic("medium");
    setTimeout(() => {
      const d1 = Math.floor(Math.random() * 6) + 1;
      const d2 = Math.floor(Math.random() * 6) + 1;
      handleRoll(d1, d2);
      setIsRolling(false);
    }, 500);
  }, [canRoll, isRolling, handleRoll]);

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-y-2 px-2 sm:px-4 py-2 bg-white/60 dark:bg-gray-900/60 border-b border-gray-200/60 dark:border-gray-700/50 backdrop-blur-md shadow-sm relative">
        
        {/* Left Section: Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {(phase === "playing" || phase === "round_summary") && (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Round <span className="text-indigo-500">{currentRound}/{totalRounds}</span>
              </div>
              {phase === "playing" && (
                <>
                  <div
                    className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                      isDanger
                        ? "text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/20 shadow-inner"
                        : "text-gray-600 dark:text-gray-300 bg-black/5 dark:bg-white/10 shadow-inner"
                    }`}
                  >
                    Roll #{rollCount || "—"}
                  </div>
                  <div className="flex items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setVirtualDiceOpen(true)}
                      title="Virtual dice"
                      className="h-8 w-8 hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                      <Dices className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={undo}
                      disabled={!undoSnapshot}
                      title={undoSnapshot && undoLabel ? `Undo: ${undoLabel}` : "Undo (Not available)"}
                      className={`h-8 w-8 hover:bg-gray-200 dark:hover:bg-gray-700 transition-opacity ${
                        !undoSnapshot ? "opacity-30 cursor-not-allowed" : ""
                      }`}
                    >
                      <Undo2 className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Center Section: Event Badge (breaks to new row on mobile, centered on large screens) */}
        {phase === "playing" && roundEventsEnabled && activeEvent && !isBust && (
          <div className="flex justify-center order-last w-full sm:w-auto sm:order-0 shrink-0 sm:absolute sm:left-1/2 sm:-translate-x-1/2 mt-1 sm:mt-0">
            <div 
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full border bg-amber-500/10 border-amber-500/20 shadow-sm cursor-help transition-transform hover:scale-105" 
              title={activeEvent.description}
            >
              <Zap className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                {activeEvent.name}
              </span>
            </div>
          </div>
        )}

        {/* Right Section: Action buttons */}
        <div className="flex items-center justify-end gap-0.5 sm:gap-1 ml-auto">
          {phase === "playing" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLeaderboardOpen(true)}
              title="Live Leaderboard"
              className="h-8 w-8 sm:h-9 sm:w-9"
            >
              <Trophy className="w-4 h-4 text-amber-500" />
            </Button>
          )}

          {phase === "setup" && (
            <Button variant="ghost" size="icon" onClick={() => setEventModalOpen(true)} title="Round Events" className="h-8 w-8 sm:h-9 sm:w-9">
              <Sparkles className="w-4 h-4 text-fuchsia-500" />
            </Button>
          )}

          {phase === "setup" && (
            <Button variant="ghost" size="icon" onClick={() => setGhostModalOpen(true)} title="Ghost Players" className="h-8 w-8 sm:h-9 sm:w-9">
              <Ghost className="w-4 h-4 text-violet-500" />
            </Button>
          )}
          
          <Button variant="ghost" size="icon" onClick={toggleTheme} title="Toggle theme" className="h-8 w-8 sm:h-9 sm:w-9">
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>

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
          <p className="text-gray-700 dark:text-gray-300 text-sm">
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

      {/* Virtual dice dialog — for playing without physical dice */}
      <Dialog open={virtualDiceOpen} onOpenChange={setVirtualDiceOpen}>
        <DialogTitle>Virtual Dice</DialogTitle>
        <div className="flex flex-col items-center gap-4 py-2">
          <DicePair
            die1={lastDie1}
            die2={lastDie2}
            isRolling={isRolling}
            onRoll={canRoll ? rollVirtual : undefined}
          />
          <Button
            variant="default"
            size="lg"
            onClick={rollVirtual}
            disabled={!canRoll || isRolling || isBust}
            className={`text-lg px-10 transition-all duration-200 ${
              isDanger
                ? "bg-amber-500 hover:bg-amber-400 text-gray-900 shadow-lg shadow-amber-500/20"
                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20"
            }`}
          >
            <Dices className="w-5 h-5 mr-2" />
            {isRolling ? "Rolling..." : isDanger ? "Risk It!" : "Roll Dice"}
          </Button>
          <span className="text-xs text-gray-600">Space / R</span>
        </div>
      </Dialog>

      {/* Info Modals for setup screen */}
      <Dialog open={eventModalOpen} onOpenChange={setEventModalOpen}>
        <DialogTitle className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-fuchsia-500" />
          Round Events
        </DialogTitle>
        <div className="max-h-[65vh] overflow-y-auto space-y-4 -mx-1 px-1">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            If enabled, one random event will trigger at the start of each round, modifying the rules for everyone.
          </p>

          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4">
            <h3 className="font-bold text-amber-600 dark:text-amber-400 mb-1 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" /> Triple Threat
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Doubles multiply the bank by 3× instead of 2× this round. Pure mayhem.
            </p>
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-4">
            <h3 className="font-bold text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-500" /> Extended Safety
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              The safe zone lasts for 5 rolls instead of 3. Push your luck!
            </p>
          </div>

          <div className="bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 rounded-xl p-4">
            <h3 className="font-bold text-violet-600 dark:text-violet-400 mb-1 flex items-center gap-2">
              <Ghost className="w-4 h-4 text-violet-500" /> Ghost Overdrive
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Every ghost rolls twice this round (two separate turns). They become absolute monsters.
            </p>
          </div>

          <div className="bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 rounded-xl p-4">
            <h3 className="font-bold text-sky-600 dark:text-sky-400 mb-1 flex items-center gap-2">
              <Cloud className="w-4 h-4 text-sky-500" /> Heavenly Sevens
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Safe-zone 7s give +140 to the bank instead of +70.
            </p>
          </div>

          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-4">
            <h3 className="font-bold text-red-600 dark:text-red-400 mb-1 flex items-center gap-2">
              <Flame className="w-4 h-4 text-red-500" /> Devil&apos;s Mercy
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              The first 7 of the danger zone does not bust — it just adds 7 and continues.
            </p>
          </div>

          <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 rounded-xl p-4">
            <h3 className="font-bold text-orange-600 dark:text-orange-400 mb-1 flex items-center gap-2">
              <Timer className="w-4 h-4 text-orange-500" /> Short Fuse
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              The safe zone only lasts 1 roll this round. Danger hits on roll 2.
            </p>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 rounded-xl p-4">
            <h3 className="font-bold text-yellow-600 dark:text-yellow-500 mb-1 flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" /> Golden Totals
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Any roll totaling 10, 11, or 12 counts as doubles this round. High rollers rejoice.
            </p>
          </div>

          <div className="bg-teal-50 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/20 rounded-xl p-4">
            <h3 className="font-bold text-teal-600 dark:text-teal-400 mb-1 flex items-center gap-2">
              <Shield className="w-4 h-4 text-teal-500" /> Resilient Bank
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              The first 7 in the danger zone only halves the bank instead of wiping it out. A fighting chance.
            </p>
          </div>

          <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl p-4">
            <h3 className="font-bold text-rose-600 dark:text-rose-400 mb-1 flex items-center gap-2">
              <Bomb className="w-4 h-4 text-rose-500" /> Time Bomb
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              A hidden roll between 4 and 10 is rigged to bust. No warning, no mercy. Nobody knows when it drops.
            </p>
          </div>
        </div>
      </Dialog>


      
      <Dialog open={ghostModalOpen} onOpenChange={setGhostModalOpen}>
        <DialogTitle className="flex items-center gap-2 mb-4">
          <Ghost className="w-5 h-5 text-violet-500" />
          Ghost Players
        </DialogTitle>
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Automated AI players that constantly push their luck. They take their turns automatically, trying to hit doubles or 7s, serving as a pace-setter or a chaotic wild card in your games.
          </p>
        </div>
      </Dialog>
      
      {/* Live Leaderboard Modal */}
      <Dialog open={leaderboardOpen} onOpenChange={setLeaderboardOpen}>
        <DialogTitle className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-amber-500" />
          Live Leaderboard
        </DialogTitle>
        <div className="space-y-3">
          {players.filter((p) => !p.isGhost).length === 0 ? (
            <p className="text-sm text-gray-500">No human players yet.</p>
          ) : (
            players
              .filter((p) => !p.isGhost)
              .sort((a, b) => b.score - a.score)
              .map((p, idx) => (
                <div key={p.id} className="flex justify-between items-center py-2 border-b border-black/5 dark:border-white/5 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm text-gray-500 w-4">{idx + 1}.</span>
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                      style={{ backgroundColor: p.color }}
                    >
                      {p.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {p.name}
                    </span>
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white">{p.score}</span>
                </div>
              ))
          )}
        </div>
      </Dialog>
    </>
  );
}
