"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { useGameStore, selectCanRoll, selectIsInDangerZone } from "@/store/game-store";
import { Zap } from "lucide-react";
import { playRollSound, playDoubleSound, playLucky7Sound, triggerHaptic } from "@/lib/sounds";

/** Number of safe-zone rolls before the danger zone kicks in. */
const SAFE_ZONE_ROLLS = 3;

export function RollControls() {
  const handleRoll = useGameStore((s) => s.handleRoll);
  const canRoll = useGameStore(selectCanRoll);
  const isDanger = useGameStore(selectIsInDangerZone);
  const lastDie1 = useGameStore((s) => s.lastDie1);
  const lastDie2 = useGameStore((s) => s.lastDie2);
  const isBust = useGameStore((s) => s.isBust);
  const phase = useGameStore((s) => s.phase);
  const rollCount = useGameStore((s) => s.rollCount);

  const [isRolling, setIsRolling] = useState(false);

  /**
   * Converts a non-doubles sum from physical dice into a (die1, die2) pair.
   * Ensures the two dice don't accidentally form doubles when they shouldn't.
   */
  const enterSum = useCallback(
    (sum: number) => {
      if (!canRoll) return;

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
    triggerHaptic("light");
    handleRoll(1, 1);
  }, [canRoll, handleRoll]);

  // Virtual dice roll triggered by keyboard shortcut (Space / R)
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

  // Play special audio cues for doubles and lucky 7s
  useEffect(() => {
    if (phase !== "playing" || !lastDie1 || !lastDie2) return;
    if (lastDie1 === lastDie2) {
      playDoubleSound();
    } else if (lastDie1 + lastDie2 === 7 && rollCount <= SAFE_ZONE_ROLLS) {
      playLucky7Sound();
    }
  }, [lastDie1, lastDie2, phase, rollCount]);

  // Keyboard shortcuts: Space/R = virtual roll, D = doubles, U = undo
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (phase !== "playing" || !canRoll) return;

      if ((e.key === " " || e.key === "r" || e.key === "R") && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        rollVirtual();
      }
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
  }, [rollVirtual, enterDoubles, phase, canRoll]);

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-md">
      <div className="w-full">
        {/* Sum buttons: always a 5×2 grid covering sums 2–11 */}
        <div className="grid grid-cols-5 gap-2 px-2">
          {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((sum) => {
            const isSeven = sum === 7;

            return (
              <motion.button
                key={sum}
                whileTap={{ scale: 0.9 }}
                onClick={() => enterSum(sum)}
                disabled={!canRoll || isBust}
                className={`
                  relative flex flex-col items-center justify-center
                  rounded-xl py-3 text-lg font-bold transition-all duration-150
                  cursor-pointer disabled:opacity-30 disabled:pointer-events-none
                  ${
                    isSeven
                      ? isDanger
                        ? "bg-red-600/80 text-white shadow-lg shadow-red-600/20 hover:bg-red-500"
                        : "bg-emerald-600/80 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500"
                      : isDanger
                        ? "bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/20"
                        : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
                  }
                `}
              >
                <span>{sum}</span>
                {isSeven && (
                  <span className="text-[10px] font-medium opacity-80 leading-tight">
                    {isDanger ? "BUST" : "+70"}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Full-width bottom button: 12 in safe zone, Doubles in danger zone */}
        {!isDanger ? (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => enterSum(12)}
            disabled={!canRoll || isBust}
            className="
              mt-2 mx-2 w-[calc(100%-1rem)]
              flex items-center justify-center gap-2
              rounded-xl py-3 text-lg font-bold transition-all duration-150
              cursor-pointer disabled:opacity-30 disabled:pointer-events-none
              bg-white/10 text-white hover:bg-white/20 border border-white/10
            "
          >
            <span>12</span>
          </motion.button>
        ) : (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={enterDoubles}
            disabled={!canRoll || isBust}
            className="
              mt-2 mx-2 w-[calc(100%-1rem)]
              flex items-center justify-center gap-2
              rounded-xl py-3 text-sm font-semibold transition-all duration-150
              cursor-pointer disabled:opacity-30 disabled:pointer-events-none
              bg-violet-600/80 text-white hover:bg-violet-500 border border-violet-500/30 shadow-lg shadow-violet-600/20
            "
          >
            <Zap className="w-4 h-4" />
            <span>Doubles</span>
            <span className="text-[10px] opacity-80">2x</span>
          </motion.button>
        )}

        <div className="text-center mt-2 text-xs text-gray-600">
          Tap the sum you rolled with real dice
        </div>
      </div>
    </div>
  );
}
