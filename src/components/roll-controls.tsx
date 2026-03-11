"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { 
  useGameStore, 
  selectCanRoll, 
  selectIsInDangerZone, 
  selectCurrentRoller,
  getSafeZoneRolls
} from "@/store/game-store";
import { Zap } from "lucide-react";
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
  const autoRollGhost = useGameStore((s) => s.autoRollGhost);
  const safeZoneRolls = useGameStore(getSafeZoneRolls);
  const devilsMercyUsed = useGameStore((s) => s.devilsMercyUsed);
  const resilientBankUsed = useGameStore((s) => s.resilientBankUsed);

  const [isRolling, setIsRolling] = useState(false);
  const isGhostTurn = currentRoller?.isGhost ?? false;

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
    const sum = lastDie1 + lastDie2;
    const isGoldenDouble = activeRoundEvent === "golden_totals" && isDanger && (sum >= 10);
    
    if (lastDie1 === lastDie2 || isGoldenDouble) {
      playDoubleSound();
    } else if (sum === 7 && rollCount <= safeZoneRolls) {
      playLucky7Sound();
    }
  }, [lastDie1, lastDie2, phase, rollCount, safeZoneRolls, activeRoundEvent, isDanger]);

  // Tracks if the ghost is currently taking its timed turn, rather than its ID.
  // This allows the same ghost to roll multiple times in a round (e.g., Ghost Overdrive or consecutive turns).
  const isAutoRollingRef = useRef(false);

  // Auto-roll for ghosts.
  useEffect(() => {
    if (phase !== "playing" || isBust || !canRoll) return;
    
    // If it's the ghost's turn and we haven't already started their roll sequence:
    if (currentRoller?.isGhost && !isAutoRollingRef.current) {
      isAutoRollingRef.current = true;
      
      const tId = setTimeout(() => {
        playRollSound();
        triggerHaptic("medium");
        
        setTimeout(() => {
          // The moment before the store updates, we clear the flag so the NEXT turn can evaluate cleanly.
          isAutoRollingRef.current = false;
          autoRollGhost();
        }, 300);
      }, 1000);

      // If the turn changes (someone undos, or phase ends) before the ghost rolls, cancel the roll safely.
      return () => {
        clearTimeout(tId);
        isAutoRollingRef.current = false;
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, isBust, canRoll, currentRoller, autoRollGhost]);

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
            const isGoldenDouble = activeRoundEvent === "golden_totals" && isDanger && (sum === 10 || sum === 11);

            let buttonColor = "";
            let buttonLabel = "";
            
            if (isSeven) {
              if (isDanger) {
                if (activeRoundEvent === "devils_mercy" && !devilsMercyUsed) {
                  buttonColor = "bg-emerald-600/80 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 border border-emerald-500/30";
                  buttonLabel = "+7 (Mercy)";
                } else if (activeRoundEvent === "resilient_bank" && !resilientBankUsed) {
                  buttonColor = "bg-orange-500/80 text-white shadow-lg shadow-orange-500/20 hover:bg-orange-400 border border-orange-500/30";
                  buttonLabel = "÷2 BANK";
                } else {
                  buttonColor = "bg-red-600/80 text-white shadow-lg shadow-red-600/20 hover:bg-red-500";
                  buttonLabel = "BUST";
                }
              } else {
                buttonColor = "bg-emerald-600/80 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500";
                buttonLabel = activeRoundEvent === "heavenly_sevens" ? "+140" : "+70";
              }
            } else if (isGoldenDouble) {
              buttonColor = "bg-violet-600/80 text-white shadow-lg shadow-violet-600/20 hover:bg-violet-500 border border-violet-500/30";
              buttonLabel = "2x";
            } else {
              buttonColor = isDanger
                ? "bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-500/25 border border-amber-300 dark:border-amber-500/20"
                : "bg-black/10 dark:bg-white/10 text-gray-900 dark:text-white hover:bg-black/20 dark:hover:bg-white/20 border border-black/10 dark:border-white/10";
            }

            return (
              <motion.button
                key={sum}
                whileTap={{ scale: 0.9 }}
                onClick={() => enterSum(sum)}
                disabled={!canRoll || isBust || isGhostTurn}
                className={`relative flex flex-col items-center justify-center rounded-xl py-3 text-lg font-bold transition-all duration-150 cursor-pointer disabled:opacity-30 disabled:pointer-events-none ${buttonColor}`}
              >
                <span>{sum}</span>
                {(isSeven || isGoldenDouble) && (
                  <span className="text-[10px] font-medium opacity-80 leading-tight">
                    {buttonLabel}
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
            disabled={!canRoll || isBust || isGhostTurn}
            className="
              mt-2 mx-2 w-[calc(100%-1rem)]
              flex items-center justify-center gap-2
              rounded-xl py-3 text-lg font-bold transition-all duration-150
              cursor-pointer disabled:opacity-30 disabled:pointer-events-none
              bg-black/10 dark:bg-white/10 text-gray-900 dark:text-white hover:bg-black/20 dark:hover:bg-white/20 border border-black/10 dark:border-white/10
            "
          >
            <span>12</span>
          </motion.button>
        ) : (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={enterDoubles}
            disabled={!canRoll || isBust || isGhostTurn}
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
            <span className="text-[10px] opacity-80">{activeRoundEvent === "triple_threat" ? "3x" : "2x"}</span>
          </motion.button>
        )}


      </div>
    </div>
  );
}
