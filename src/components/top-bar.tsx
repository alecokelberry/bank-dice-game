"use client";

import { useState, useCallback } from "react";
import { useGameStore, selectIsInDangerZone, selectCanRoll } from "@/store/game-store";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTitle } from "@/components/ui/dialog";
import { DicePair } from "@/components/dice";
import { Undo2, Settings, RotateCcw, AlertTriangle, Dices, Sun, Moon, Zap, Sparkles, Ghost, Shield, Cloud, Flame } from "lucide-react";
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
  const [powerModalOpen, setPowerModalOpen] = useState(false);
  const [ghostModalOpen, setGhostModalOpen] = useState(false);

  const roundEventsEnabled = useGameStore((s) => s.roundEventsEnabled);
  const superpowersEnabled = useGameStore((s) => s.superpowersEnabled);
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
      <header className="flex items-center justify-between px-4 py-3 bg-black/5 dark:bg-white/5 border-b border-black/10 dark:border-white/10 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          {(phase === "playing" || phase === "round_summary") && (
            <>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                Round{" "}
                <span className="text-indigo-400">
                  {currentRound}/{totalRounds}
                </span>
              </div>
              {phase === "playing" && (
                <div
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    isDanger
                      ? "text-amber-600 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/15 border border-amber-300 dark:border-amber-500/20"
                      : "text-gray-600 dark:text-gray-400 bg-black/10 dark:bg-white/10"
                  }`}
                >
                  Roll #{rollCount || "—"}
                </div>
              )}
            </>
          )}
          {phase === "setup" && (
            <div className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">BANK!</div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          {phase === "playing" && undoSnapshot && (
            <Button
              variant="ghost"
              size="icon"
              onClick={undo}
              title={undoLabel ? `Undo: ${undoLabel}` : "Undo"}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white"
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
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          )}
          {phase === "playing" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setVirtualDiceOpen(true)}
              title="Virtual dice"
            >
              <Dices className="w-4 h-4" />
            </Button>
          )}
          {/* Always show in setup. In playing phase, only show if enabled */}
          {(phase === "setup" || roundEventsEnabled) && (
            <Button variant="ghost" size="icon" onClick={() => setEventModalOpen(true)} title="Round Events">
              <Zap className="w-4 h-4 text-amber-500" />
            </Button>
          )}
          {(phase === "setup" || superpowersEnabled) && (
            <Button variant="ghost" size="icon" onClick={() => setPowerModalOpen(true)} title="Superpowers">
              <Sparkles className="w-4 h-4 text-pink-500" />
            </Button>
          )}
          {(phase === "setup" || hasGhosts) && (
            <Button variant="ghost" size="icon" onClick={() => setGhostModalOpen(true)} title="Ghost Players">
              <Ghost className="w-4 h-4 text-violet-500" />
            </Button>
          )}

          {phase !== "setup" && (
            <Button variant="ghost" size="icon" onClick={onOpenSettings} title="Settings">
              <Settings className="w-4 h-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={toggleTheme} title="Toggle theme">
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
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
          <Zap className="w-5 h-5 text-amber-500" />
          Round Events
        </DialogTitle>
        <div className="space-y-4">
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
              The first 7 of the round does not bust — it just adds 7 and continues.
            </p>
          </div>
        </div>
      </Dialog>

      <Dialog open={powerModalOpen} onOpenChange={setPowerModalOpen}>
        <DialogTitle className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-pink-500" />
          Superpowers
        </DialogTitle>
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Determine who gets special character abilities that are randomly assigned each round.
          </p>
          
          <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl p-6 text-center mt-4">
            <p className="text-sm text-gray-500 font-medium">Coming Soon</p>
            <p className="text-xs text-gray-400 mt-2">
              Draft unique abilities like shield, steal, and multiplier bonuses to turn the tide.
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
    </>
  );
}
