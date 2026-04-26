"use client";

import { useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { 
  useGameStore, 
  selectCanRoll,
  selectIsInDangerZone,
  selectCurrentRoller,
  getSafeZoneRolls,
} from "@/store/game-store";
import { playRollSound, playDoubleSound, playLucky7Sound, triggerHaptic } from "@/lib/sounds";

export function RollControls() {
  const handleRoll = useGameStore((s) => s.handleRoll);
  const canRoll = useGameStore(selectCanRoll);
  const isDanger = useGameStore(selectIsInDangerZone);
  const lastDie1 = useGameStore((s) => s.lastDie1);
  const lastDie2 = useGameStore((s) => s.lastDie2);
  const isBust = useGameStore((s) => s.isBust);
  const phase = useGameStore((s) => s.phase);
  const rollCount = useGameStore((s) => s.rollCount);
  const currentRoller = useGameStore(selectCurrentRoller);
  const currentRollerIndex = useGameStore((s) => s.currentRollerIndex);
  const activeRoundEvent = useGameStore((s) => s.activeRoundEvent);
  const safeZoneRolls = useGameStore(getSafeZoneRolls);
  const devilsMercyUsed = useGameStore((s) => s.devilsMercyUsed);
  const resilientBankUsed = useGameStore((s) => s.resilientBankUsed);

  const isGhostTurn = currentRoller?.isGhost ?? false;
  /**
   * Converts a non-doubles sum from physical dice into a (die1, die2) pair.
   * Ensures the two dice don't accidentally form doubles when they shouldn't.
   */
  const enterSum = useCallback(
    (sum: number) => {
      if (!canRoll) return;
      playRollSound();

      let d1: number, d2: number;
      // 12 can only physically be 6+6 (doubles), but in safe rounds it's
      // a valid non-double result — pass forceNotDouble to the store.
      if (sum === 12) {
        d1 = 6;
        d2 = 6;
        triggerHaptic("light");
        handleRoll(d1, d2, true);
        return;
      } else if (sum === 7) {
        d1 = 4;
        d2 = 3;
      } else if (sum <= 7) {
        d1 = Math.min(6, Math.ceil(sum / 2));
        d2 = sum - d1;
        if (d1 === d2 && sum < 12 && sum > 2) {
          d1 = Math.min(6, d1 + 1);
          d2 = sum - d1;
        }
      } else {
        d2 = 6;
        d1 = sum - d2;
        if (d1 === d2) {
          d1 = Math.min(6, d1 + 1);
          d2 = sum - d1;
        }
      }

      if (d1 < 1 || d1 > 6 || d2 < 1 || d2 > 6) return;
      triggerHaptic("light");
      handleRoll(d1, d2);
    },
    [canRoll, handleRoll]
  );

  // Doubles are entered directly — the actual die value doesn't matter
  const enterDoubles = useCallback(() => {
    if (!canRoll) return;
    playRollSound();
    triggerHaptic("light");
    handleRoll(1, 1);
  }, [canRoll, handleRoll]);

  // Play special audio cues for doubles and lucky 7s (skip on initial mount)
  const mountedRef = useRef(false);
  useEffect(() => {
    if (!mountedRef.current) { mountedRef.current = true; return; }
    if (phase !== "playing" || !lastDie1 || !lastDie2) return;
    const sum = lastDie1 + lastDie2;
    const isGoldenDouble = activeRoundEvent === "golden_totals" && isDanger && (sum >= 10);

    if (lastDie1 === lastDie2 || isGoldenDouble) {
      playDoubleSound();
    } else if (sum === 7 && rollCount <= safeZoneRolls) {
      playLucky7Sound();
    }
  }, [lastDie1, lastDie2, phase, rollCount, safeZoneRolls, activeRoundEvent, isDanger]);

  // Keyboard shortcuts: D = doubles, U = undo
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (phase !== "playing" || !canRoll) return;

      if (e.key === "d" || e.key === "D") {
        e.preventDefault();
        enterDoubles();
      }
      if (e.key === "u" || e.key === "U") {
        e.preventDefault();
        useGameStore.getState().undo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [enterDoubles, phase, canRoll]);

  const disabledProps = { disabled: !canRoll || isBust || isGhostTurn };
  const neutralColor = "bg-white/10 text-white hover:bg-white/20 border border-white/10";

  let sevenColor = "";
  let sevenLabel = "";
  if (isDanger) {
    if (activeRoundEvent === "time_bomb") {
      sevenColor = "bg-emerald-600/80 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 border border-emerald-500/30";
      sevenLabel = "+7";
    } else if (activeRoundEvent === "devils_mercy" && !devilsMercyUsed) {
      sevenColor = "bg-emerald-600/80 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 border border-emerald-500/30";
      sevenLabel = "+7";
    } else if (activeRoundEvent === "resilient_bank" && !resilientBankUsed) {
      sevenColor = "bg-orange-500/80 text-white shadow-lg shadow-orange-500/20 hover:bg-orange-400 border border-orange-500/30";
      sevenLabel = "÷2";
    } else {
      sevenColor = "bg-red-600/80 text-white shadow-lg shadow-red-600/20 hover:bg-red-500";
      sevenLabel = "BUST";
    }
  } else {
    sevenColor = "bg-emerald-600/80 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500";
    sevenLabel = activeRoundEvent === "heavenly_sevens" ? "+140" : "+70";
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-md xl:max-w-2xl 2xl:max-w-4xl">
      <div className="w-full px-2">
        <div className="grid grid-cols-4 gap-2 md:gap-2.5 xl:gap-4">
          {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((sum) => {
            const isSeven = sum === 7;
            const isGoldenDouble = activeRoundEvent === "golden_totals" && isDanger && (sum === 10 || sum === 11);
            const color = isSeven
              ? sevenColor
              : isGoldenDouble
              ? "bg-violet-600/80 text-white shadow-lg shadow-violet-600/20 hover:bg-violet-500 border border-violet-500/30"
              : neutralColor;

            return (
              <motion.button
                key={sum}
                whileTap={{ scale: 0.9 }}
                onClick={() => enterSum(sum)}
                {...disabledProps}
                className={`relative flex flex-col items-center justify-center rounded-2xl aspect-square text-2xl md:text-3xl xl:text-4xl 2xl:text-5xl font-bold transition-all duration-150 cursor-pointer disabled:opacity-30 disabled:pointer-events-none ${color}`}
              >
                <span>{isSeven ? sevenLabel : sum}</span>
                {isGoldenDouble && (
                  <span className="text-xs font-medium opacity-80 leading-tight">2x</span>
                )}
              </motion.button>
            );
          })}

          {/* 12 — valid in safe zone, dimmed in danger zone (would be doubles) */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => !isDanger && enterSum(12)}
            disabled={!canRoll || isBust || isGhostTurn || isDanger}
            className={`flex items-center justify-center rounded-2xl aspect-square text-2xl md:text-3xl xl:text-4xl 2xl:text-5xl font-bold transition-all duration-150 cursor-pointer disabled:opacity-30 disabled:pointer-events-none ${neutralColor}`}
          >
            12
          </motion.button>

          {/* Doubles — valid in danger zone, dimmed in safe zone */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => isDanger && enterDoubles()}
            disabled={!canRoll || isBust || isGhostTurn || !isDanger}
            className={`flex items-center justify-center rounded-2xl aspect-square text-2xl md:text-3xl xl:text-4xl 2xl:text-5xl font-bold transition-all duration-150 cursor-pointer disabled:opacity-30 disabled:pointer-events-none ${
              isDanger
                ? "bg-violet-600/80 text-white hover:bg-violet-500 border border-violet-500/30 shadow-lg shadow-violet-600/20"
                : neutralColor
            }`}
          >
            {isDanger ? (activeRoundEvent === "triple_threat" ? "3x" : "2x") : "2×"}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
