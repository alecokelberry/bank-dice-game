"use client";

import { motion } from "framer-motion";
import { useGameStore } from "@/store/game-store";
import { Button } from "@/components/ui/button";

import { playClickSound } from "@/lib/sounds";

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

/** Full-screen overlay shown between rounds displaying the current standings. */
export function RoundSummary() {
  const phase = useGameStore((s) => s.phase);
  const roundSummary = useGameStore((s) => s.roundSummary);
  const roundSummaryRound = useGameStore((s) => s.roundSummaryRound);
  const currentRound = useGameStore((s) => s.currentRound);
  const totalRounds = useGameStore((s) => s.totalRounds);
  const dismissRoundSummary = useGameStore((s) => s.dismissRoundSummary);
  const players = useGameStore((s) => s.players);
  if (phase !== "round_summary" || !roundSummary) return null;

  const sortedPlayers = [...players].filter((p) => !p.isGhost).sort((a, b) => b.score - a.score);

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
          className="mb-4 flex flex-col items-center"
        >
          <div className="text-sm uppercase tracking-wider text-gray-500 mb-1">Round Complete</div>
          <div className="text-4xl font-black text-white mb-2">Round {roundSummaryRound}</div>
        </motion.div>

        {/* Ranked player standings */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-1.5 mb-5"
        >
          {sortedPlayers.map((player, idx) => {
            const rank = idx === 0 ? 1 : sortedPlayers[idx - 1].score === player.score
              ? sortedPlayers.findIndex((p) => p.score === player.score) + 1
              : idx + 1;
            return (
              <div
                key={player.id}
                className={`flex items-center justify-between rounded-xl px-4 py-2.5 ${
                  idx === 0
                    ? "bg-amber-400/10 border border-amber-400/20"
                    : "bg-white/5 border border-white/10"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-black text-white shrink-0"
                    style={{ backgroundColor: player.color }}
                  >
                    {ordinal(rank)}
                  </div>
                  <span className="text-white font-semibold">{player.name}</span>
                </div>
                <span className="text-white tabular-nums font-bold">
                  {player.score.toLocaleString()}
                </span>
              </div>
            );
          })}
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
