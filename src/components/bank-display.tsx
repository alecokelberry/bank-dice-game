"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore, selectIsInDangerZone, selectCurrentRoller, ROUND_EVENTS } from "@/store/game-store";
import { Ghost, Landmark, Dices, Zap, Shield, Cloud, Flame, Timer, Star, Bomb } from "lucide-react";
import { Dialog, DialogTitle } from "@/components/ui/dialog";

const EVENT_UI: Record<string, any> = {
  triple_threat: { icon: Zap, badgeBg: "bg-amber-500/20 border-amber-500/30", badgeText: "text-amber-500 dark:text-amber-400", badgeIcon: "text-amber-600 dark:text-amber-400", modalIcon: "text-amber-500" },
  extended_safety: { icon: Shield, badgeBg: "bg-emerald-500/20 border-emerald-500/30", badgeText: "text-emerald-500 dark:text-emerald-400", badgeIcon: "text-emerald-600 dark:text-emerald-400", modalIcon: "text-emerald-500" },
  ghost_overdrive: { icon: Ghost, badgeBg: "bg-violet-500/20 border-violet-500/30", badgeText: "text-violet-500 dark:text-violet-400", badgeIcon: "text-violet-600 dark:text-violet-400", modalIcon: "text-violet-500" },
  heavenly_sevens: { icon: Cloud, badgeBg: "bg-sky-500/20 border-sky-500/30", badgeText: "text-sky-500 dark:text-sky-400", badgeIcon: "text-sky-600 dark:text-sky-400", modalIcon: "text-sky-500" },
  devils_mercy: { icon: Flame, badgeBg: "bg-red-500/20 border-red-500/30", badgeText: "text-red-500 dark:text-red-400", badgeIcon: "text-red-600 dark:text-red-400", modalIcon: "text-red-500" },
  short_fuse: { icon: Timer, badgeBg: "bg-orange-500/20 border-orange-500/30", badgeText: "text-orange-500 dark:text-orange-400", badgeIcon: "text-orange-600 dark:text-orange-400", modalIcon: "text-orange-500" },
  golden_totals: { icon: Star, badgeBg: "bg-yellow-500/20 border-yellow-500/30", badgeText: "text-yellow-600 dark:text-yellow-500", badgeIcon: "text-yellow-600 dark:text-yellow-500", modalIcon: "text-yellow-500" },
  resilient_bank: { icon: Shield, badgeBg: "bg-teal-500/20 border-teal-500/30", badgeText: "text-teal-500 dark:text-teal-400", badgeIcon: "text-teal-600 dark:text-teal-400", modalIcon: "text-teal-500" },
  time_bomb: { icon: Bomb, badgeBg: "bg-rose-500/20 border-rose-500/30", badgeText: "text-rose-500 dark:text-rose-400", badgeIcon: "text-rose-600 dark:text-rose-400", modalIcon: "text-rose-500" },
};

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
  const roundEventsEnabled = useGameStore((s) => s.roundEventsEnabled);
  const activeRoundEventId = useGameStore((s) => s.activeRoundEvent);
  const activeEvent = ROUND_EVENTS.find((e) => e.id === activeRoundEventId);
  const phase = useGameStore((s) => s.phase);
  
  const [eventModalOpen, setEventModalOpen] = useState(false);

  // Dynamic color based on game state: red for bust, amber for danger, green for safe
  const colorClass = isBust ? "text-red-500" : isDanger ? "text-amber-400" : "text-emerald-400";
  const glowColor = isBust
    ? "rgba(239,68,68,0.3)"
    : isDanger
      ? "rgba(251,191,36,0.2)"
      : "rgba(52,211,153,0.15)";

  return (
    <div className="flex flex-col items-center gap-2 relative">

      {/* Round Event Badge positioned above the score */}
      {phase === "playing" && roundEventsEnabled && activeEvent && !isBust && (() => {
        const ui = EVENT_UI[activeEvent.id] || EVENT_UI.triple_threat;
        const Icon = ui.icon;
        return (
          <div className="relative z-10 mb-2">
            <button 
              type="button"
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full border shadow-sm cursor-pointer transition-transform hover:scale-105 ${ui.badgeBg}`} 
              title="Click for details"
              onClick={() => setEventModalOpen(true)}
            >
              <Icon className={`w-3.5 h-3.5 shrink-0 ${ui.badgeIcon}`} />
              <span className={`text-xs font-bold uppercase tracking-wider ${ui.badgeText}`}>
                {activeEvent.name}
              </span>
            </button>
          </div>
        );
      })()}

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
                {currentRoller.isGhost ? <Ghost className="w-3 h-3" /> : currentRoller.name[0].toUpperCase()}
              </div>
              <Dices className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {currentRoller.name}&rsquo;s roll
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Event Details Modal */}
      {activeEvent && (() => {
        const ui = EVENT_UI[activeEvent.id] || EVENT_UI.triple_threat;
        const Icon = ui.icon;
        return (
          <Dialog open={eventModalOpen} onOpenChange={setEventModalOpen}>
            <DialogTitle className="flex items-center gap-2 mb-4">
              <Icon className={`w-5 h-5 ${ui.modalIcon}`} />
              {activeEvent.name}
            </DialogTitle>
            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {activeEvent.description}
              </p>
            </div>
          </Dialog>
        );
      })()}
    </div>
  );
}
