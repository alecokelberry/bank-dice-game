"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "@/store/game-store";
import { Button } from "@/components/ui/button";
import { SkipForward, ShieldX, ShieldCheck } from "lucide-react";
import { playBustSound, triggerHaptic } from "@/lib/sounds";

export function BustOverlay() {
  const isBust = useGameStore((s) => s.isBust);
  const currentRound = useGameStore((s) => s.currentRound);
  const totalRounds = useGameStore((s) => s.totalRounds);
  const players = useGameStore((s) => s.players);
  const bankedThisRound = useGameStore((s) => s.bankedThisRound);
  const advanceRound = useGameStore((s) => s.advanceRound);

  // Sound effect and haptic feedback on bust
  useEffect(() => {
    if (isBust) {
      playBustSound();
      triggerHaptic("heavy");
    }
  }, [isBust]);

  if (!isBust) return null;

  const bankedPlayers = players.filter((p) => bankedThisRound.includes(p.id));
  const bustedPlayers = players.filter((p) => !bankedThisRound.includes(p.id));

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
          <p className="text-red-300 text-base mb-6">
            A 7 was rolled in the danger zone!
          </p>
        </motion.div>

        {/* Show who got busted vs who banked safely */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-2 mb-6"
        >
          {bustedPlayers.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              <ShieldX className="w-4 h-4 text-red-400" />
              {bustedPlayers.map((p) => (
                <span
                  key={p.id}
                  className="text-red-300 text-sm font-medium bg-red-500/15 px-2 py-0.5 rounded-full"
                >
                  {p.name}
                </span>
              ))}
              <span className="text-red-400/70 text-xs">got nothing</span>
            </div>
          )}
          {bankedPlayers.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              {bankedPlayers.map((p) => (
                <span
                  key={p.id}
                  className="text-emerald-300 text-sm font-medium bg-emerald-500/15 px-2 py-0.5 rounded-full"
                >
                  {p.name}
                </span>
              ))}
              <span className="text-emerald-400/70 text-xs">safe!</span>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            variant="default"
            size="lg"
            onClick={advanceRound}
            className="bg-white text-gray-900 hover:bg-gray-200 text-lg"
          >
            <SkipForward className="w-5 h-5 mr-2" />
            {currentRound >= totalRounds ? "See Results" : "Next Round"}
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
