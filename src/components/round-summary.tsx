"use client";

import { motion } from "framer-motion";
import { useGameStore } from "@/store/game-store";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp } from "lucide-react";
import { playClickSound } from "@/lib/sounds";

/** Full-screen overlay shown between rounds displaying the current standings. */
export function RoundSummary() {
  const phase = useGameStore((s) => s.phase);
  const roundSummary = useGameStore((s) => s.roundSummary);
  const roundSummaryRound = useGameStore((s) => s.roundSummaryRound);
  const currentRound = useGameStore((s) => s.currentRound);
  const dismissRoundSummary = useGameStore((s) => s.dismissRoundSummary);
  const players = useGameStore((s) => s.players);

  if (phase !== "round_summary" || !roundSummary) return null;

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-30 flex items-center justify-center bg-gray-950/90 backdrop-blur-sm overflow-y-auto"
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
          className="mb-4"
        >
          <div className="text-sm uppercase tracking-wider text-gray-500 mb-1">Round Complete</div>
          <div className="text-4xl font-black text-white">Round {roundSummaryRound}</div>
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
                  ? "bg-amber-400/10 border border-amber-400/20"
                  : "bg-white/5 border border-white/10"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold w-5 ${idx === 0 ? "text-amber-400" : "text-gray-500"}`}>
                  #{idx + 1}
                </span>
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                  style={{ backgroundColor: player.color }}
                >
                  {player.name.slice(0, 2).toUpperCase()}
                </div>
                <span className="text-white font-medium text-sm">{player.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-300 tabular-nums font-mono text-sm">
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
            <ArrowRight className="w-5 h-5 mr-2" />
            Round {currentRound}
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
