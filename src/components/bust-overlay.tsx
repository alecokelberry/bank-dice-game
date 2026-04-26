"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "@/store/game-store";
import { Button } from "@/components/ui/button";
import { playBustSound, triggerHaptic } from "@/lib/sounds";

export function BustOverlay() {
  const isBust = useGameStore((s) => s.isBust);
  const currentRound = useGameStore((s) => s.currentRound);
  const totalRounds = useGameStore((s) => s.totalRounds);
  const advanceRound = useGameStore((s) => s.advanceRound);

  // Sound effect and haptic feedback on bust
  useEffect(() => {
    if (isBust) {
      playBustSound();
      triggerHaptic("heavy");
    }
  }, [isBust]);

  if (!isBust) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-30 flex items-center justify-center bg-red-950/80 backdrop-blur-sm"
    >
      {/* Screen shake animation on bust */}
      <motion.div
        animate={{ x: [0, -8, 8, -6, 6, -3, 3, 0] }}
        transition={{ duration: 0.5 }}
        className="text-center px-6 max-w-sm w-full"
      >
        <motion.div
          initial={{ scale: 0.3, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 12 }}
        >
          <div
            className="text-8xl font-black text-red-500 mb-2"
            style={{ textShadow: "0 0 60px rgba(239,68,68,0.5)" }}
          >
            BUST!
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            variant="default"
            size="lg"
            onClick={advanceRound}
            className="bg-white text-gray-900 hover:bg-gray-200 text-lg"
          >
            {currentRound > totalRounds ? "See Results" : "View Leaderboard"}
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
