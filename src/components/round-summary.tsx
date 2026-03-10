"use client";

import { motion } from "framer-motion";
import { useGameStore } from "@/store/game-store";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, Zap } from "lucide-react";
import { playClickSound } from "@/lib/sounds";

/** Full-screen overlay shown between rounds displaying the current standings. */
export function RoundSummary() {
  const phase = useGameStore((s) => s.phase);
  const roundSummary = useGameStore((s) => s.roundSummary);
  const roundSummaryRound = useGameStore((s) => s.roundSummaryRound);
  const currentRound = useGameStore((s) => s.currentRound);
  const totalRounds = useGameStore((s) => s.totalRounds);
  const dismissRoundSummary = useGameStore((s) => s.dismissRoundSummary);
  const players = useGameStore((s) => s.players);
  const activeRoundEvent = useGameStore((s) => s.activeRoundEvent);

  if (phase !== "round_summary" || !roundSummary) return null;

  const sortedPlayers = [...players].filter((p) => !p.isGhost).sort((a, b) => b.score - a.score);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-30 flex items-center justify-center bg-white/90 dark:bg-gray-950/90 backdrop-blur-sm overflow-y-auto"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="text-center px-6 max-w-sm w-full py-8"
      >
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex flex-col items-center"
        >
          <div className="text-sm uppercase tracking-wider text-gray-500 dark:text-gray-500 mb-1">Round Complete</div>
          <div className="text-4xl font-black text-gray-900 dark:text-white mb-2">Round {roundSummaryRound}</div>
          
          {currentRound <= totalRounds && activeRoundEvent === "triple_threat" && (
            <div className="inline-flex items-center justify-center gap-1.5 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 px-3 py-1 rounded-full text-xs font-bold mt-1">
              <Zap className="w-3.5 h-3.5" /> Next Event: Triple Threat
            </div>
          )}
        </motion.div>

        {/* Ranked player standings */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-1.5 mb-5"
        >
          {sortedPlayers.map((player, idx) => (
            <div
              key={player.id}
              className={`flex items-center justify-between rounded-xl px-4 py-2 ${
                idx === 0
                  ? "bg-amber-50 dark:bg-amber-400/10 border border-amber-200 dark:border-amber-400/20"
                  : "bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold w-5 ${idx === 0 ? "text-amber-400" : "text-gray-500 dark:text-gray-500"}`}>
                  #{idx + 1}
                </span>
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                  style={{ backgroundColor: player.color }}
                >
                  {player.name.slice(0, 2).toUpperCase()}
                </div>
                <span className="text-gray-900 dark:text-white font-medium text-sm">{player.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-700 dark:text-gray-300 tabular-nums font-mono text-sm">
                  {player.score}
                </span>
                <TrendingUp className="w-3 h-3 text-emerald-400" />
              </div>
            </div>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <Button
            variant="default"
            size="lg"
            onClick={() => {
              playClickSound();
              dismissRoundSummary();
            }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-lg px-10"
          >
            {currentRound > totalRounds ? "See Results" : "Next Round"}
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
