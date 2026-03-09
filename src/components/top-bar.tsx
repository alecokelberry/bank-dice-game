"use client";

import { useState, useCallback } from "react";
import { useGameStore, selectIsInDangerZone, selectCanRoll } from "@/store/game-store";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTitle } from "@/components/ui/dialog";
import { DicePair } from "@/components/dice";
import { Undo2, Settings, RotateCcw, AlertTriangle, Dices } from "lucide-react";
import { playRollSound, triggerHaptic } from "@/lib/sounds";

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
      <header className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          {(phase === "playing" || phase === "round_summary") && (
            <>
              <div className="text-sm font-semibold text-white">
                Round{" "}
                <span className="text-indigo-400">
                  {currentRound}/{totalRounds}
                </span>
              </div>
              {phase === "playing" && (
                <div
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    isDanger
                      ? "text-amber-300 bg-amber-500/15 border border-amber-500/20"
                      : "text-gray-400 bg-white/10"
                  }`}
                >
                  Roll #{rollCount || "—"}
                </div>
              )}
            </>
          )}
          {phase === "setup" && (
            <div className="text-lg font-bold text-white tracking-tight">BANK!</div>
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
              className="text-gray-400 hover:text-white"
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
          {phase !== "setup" && (
            <Button variant="ghost" size="icon" onClick={onOpenSettings} title="Settings">
              <Settings className="w-4 h-4" />
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
    </>
  );
}
