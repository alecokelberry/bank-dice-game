"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { useGameStore } from "@/store/game-store";
import { Button } from "@/components/ui/button";
import { Trophy, RotateCcw } from "lucide-react";

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}
import { playWinSound } from "@/lib/sounds";

export function WinnerScreen() {
  const players = useGameStore((s) => s.players);
  const resetGame = useGameStore((s) => s.resetGame);
  const getWinners = useGameStore((s) => s.getWinners);
  const sortedPlayers = [...players].filter((p) => !p.isGhost).sort((a, b) => b.score - a.score);
  const winners = getWinners();
  const isTie = winners.length > 1;

  // Celebratory confetti burst and win fanfare on mount
  useEffect(() => {
    playWinSound();
    const duration = 3000;
    const end = Date.now() + duration;
    const colors = ["#f59e0b", "#10b981", "#6366f1", "#ef4444"];
    let rafId: number;

    const frame = () => {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors });
      if (Date.now() < end) rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-40 flex flex-col items-center justify-start bg-gray-950/95 backdrop-blur-md p-6 overflow-y-auto"
    >
      <div className="flex flex-col items-center max-w-sm w-full pt-8">
        {/* Trophy icon */}
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
          className="mb-6"
        >
          <Trophy className="w-20 h-20 text-amber-400" />
        </motion.div>

        {/* Winner announcement */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-3xl md:text-5xl font-black text-white mb-2 text-center"
        >
          {isTie ? (
            <>
              {winners.map((w, i) => (
                <span key={w.id}>
                  {i > 0 && <span className="text-gray-500"> & </span>}
                  {w.name}
                </span>
              ))}
              <span className="text-amber-400"> Tie!</span>
            </>
          ) : (
            <>{winners[0]?.name} Wins!</>
          )}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-xl text-emerald-400 font-bold mb-8"
        >
          {winners[0]?.score} points
        </motion.p>

        {/* Final leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="w-full space-y-2 mb-6"
        >
          {sortedPlayers.map((player, idx) => {
            const rank = idx === 0 ? 1 : sortedPlayers[idx - 1].score === player.score
              ? sortedPlayers.findIndex((p) => p.score === player.score) + 1
              : idx + 1;
            const isWinner = winners.some((w) => w.id === player.id);
            return (
              <div
                key={player.id}
                className="flex items-center justify-between rounded-xl px-4 py-2.5 border"
                style={{
                  backgroundColor: player.color + "55",
                  borderColor: player.color + "cc",
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-black text-white/60 w-6 shrink-0">{ordinal(rank)}</span>
                  <span className="text-3xl font-bold text-white">{player.name}</span>
                </div>
                <span className="text-white tabular-nums font-bold">
                  {player.score.toLocaleString()}
                </span>
              </div>
            );
          })}
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }}>
          <Button
            variant="default"
            size="lg"
            onClick={resetGame}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-lg"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Play Again
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}
