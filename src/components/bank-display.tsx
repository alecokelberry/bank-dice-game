"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore, selectIsInDangerZone, selectCurrentRoller, ROUND_EVENTS } from "@/store/game-store";
import { Landmark, Dices, Zap } from "lucide-react";

/** Smoothly counts from the previous value to the new one using eased interpolation. */
function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);

  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = value;
    if (prev === value) return;

    const diff = value - prev;
    const steps = Math.min(Math.abs(diff), 20);
    if (steps === 0) {
      setDisplay(value);
      return;
    }

    const stepDuration = 300 / steps;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      // Ease-out cubic for a natural deceleration feel
      const eased = 1 - Math.pow(1 - step / steps, 3);
      setDisplay(Math.round(prev + diff * eased));
      if (step >= steps) {
        clearInterval(interval);
        setDisplay(value);
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [value]);

  return <>{display}</>;
}

export function BankDisplay() {
  const bank = useGameStore((s) => s.bank);
  const isBust = useGameStore((s) => s.isBust);
  const isDanger = useGameStore(selectIsInDangerZone);
  const currentRoller = useGameStore(selectCurrentRoller);
  const activeRoundEventId = useGameStore((s) => s.activeRoundEvent);
  const activeEvent = ROUND_EVENTS.find((e) => e.id === activeRoundEventId);


  // Dynamic color based on game state: red for bust, amber for danger, green for safe
  const colorClass = isBust ? "text-red-500" : isDanger ? "text-amber-400" : "text-emerald-400";
  const glowColor = isBust
    ? "rgba(239,68,68,0.3)"
    : isDanger
      ? "rgba(251,191,36,0.2)"
      : "rgba(52,211,153,0.15)";

  return (
    <div className="flex flex-col items-center gap-2 relative">
      <div className="flex items-center gap-2 text-sm uppercase tracking-wider text-gray-600 dark:text-gray-400 font-medium">
        <Landmark className="w-4 h-4" />
        <span>Bank</span>
      </div>

      {activeEvent && !isBust && (
        <motion.div
           initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
           className="mt-1 px-3 py-2 rounded-xl border bg-amber-500/10 border-amber-500/20 flex flex-col items-center max-w-xs text-center relative z-20"
        >
          <div className="flex items-center gap-1.5 mb-0.5">
            <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
              {activeEvent.name}
            </span>
          </div>
          <span className="text-[10px] text-amber-400/80 leading-tight">
            {activeEvent.description}
          </span>
        </motion.div>
      )}


      {/* Ambient glow behind the bank number */}
      <div
        className="absolute top-8 w-48 h-48 rounded-full blur-3xl opacity-60 pointer-events-none transition-all duration-500"
        style={{ background: glowColor }}
      />

      <AnimatePresence mode="popLayout">
        <motion.div
          key={isBust ? "bust" : "value"}
          initial={{ scale: 1.3, opacity: 0 }}
          animate={{
            scale: isDanger && !isBust ? [1, 1.02, 1] : 1,
            opacity: 1,
          }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={
            isDanger && !isBust
              ? { scale: { repeat: Infinity, duration: 1.5, ease: "easeInOut" }, opacity: { duration: 0.2 } }
              : { type: "spring", stiffness: 300, damping: 20 }
          }
          className={`text-7xl md:text-8xl font-black tabular-nums relative z-10 ${colorClass}`}
          style={{ textShadow: `0 0 40px ${glowColor}` }}
        >
          {isBust ? "BUST!" : <AnimatedNumber value={bank} />}
        </motion.div>
      </AnimatePresence>

      {/* Current roller indicator pill */}
      <div className="flex flex-col items-center gap-1 relative z-10">
        <AnimatePresence mode="wait">
          {currentRoller && !isBust && (
            <motion.div
              key={currentRoller.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex items-center gap-2 mt-1 px-3 py-1.5 rounded-full border bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10"
            >
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-900 dark:text-white shrink-0"
                style={{ backgroundColor: currentRoller.color }}
              >
                {currentRoller.name[0].toUpperCase()}
              </div>
              <Dices className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {currentRoller.name}&rsquo;s roll
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
