"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useGameStore, selectCanBank, selectCurrentRoller } from "@/store/game-store";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTitle } from "@/components/ui/dialog";
import { Landmark, Check, Dices, Ghost } from "lucide-react";
import { playBankSound, triggerHaptic } from "@/lib/sounds";

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

/** Circular avatar: ghost icon for ghosts, rank number for humans. */
function PlayerAvatar({ color, isGhost, rank, name }: { color: string; isGhost?: boolean; rank?: number; name?: string }) {
  if (isGhost) {
    return (
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: color }}
      >
        <Ghost className="w-5 h-5 text-white" />
      </div>
    );
  }
  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
      style={{ backgroundColor: color }}
    >
      <span className="text-[11px] font-black leading-none">{rank != null ? ordinal(rank) : "—"}</span>
    </div>
  );
}

export function PlayerList({ mode = "bank" }: { mode?: "leaderboard" | "bank" }) {
  const players = useGameStore((s) => s.players);
  const bankedThisRound = useGameStore((s) => s.bankedThisRound);
  const handleBank = useGameStore((s) => s.handleBank);
  const canBank = useGameStore(selectCanBank);
  const bank = useGameStore((s) => s.bank);
  const phase = useGameStore((s) => s.phase);
  const currentRoller = useGameStore(selectCurrentRoller);
  const isBust = useGameStore((s) => s.isBust);
  const currentRound = useGameStore((s) => s.currentRound);
  const ghostsActiveUntilRound = useGameStore((s) => s.ghostsActiveUntilRound);
  const rollCount = useGameStore((s) => s.rollCount);
  const lastDie1 = useGameStore((s) => s.lastDie1);
  const lastDie2 = useGameStore((s) => s.lastDie2);

  // During gameplay, hide ghosts that are past their active round limit.
  const visiblePlayers = players.filter(
    (p) => !p.isGhost || currentRound <= ghostsActiveUntilRound
  );

  // Compute live rank for each human player by score (ties share the same rank)
  const humanPlayers = visiblePlayers.filter(p => !p.isGhost);
  const sortedByScore = [...humanPlayers].sort((a, b) => b.score - a.score);
  const rankMap = new Map<string, number>();
  sortedByScore.forEach((p, i) => {
    const rank = i === 0 || sortedByScore[i - 1].score !== p.score ? i + 1 : rankMap.get(sortedByScore[i - 1].id)!;
    rankMap.set(p.id, rank);
  });

  // Keyboard shortcuts: B = bank first unbanked player, 1-9 = bank specific player
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (phase !== "playing" || !canBank) return;

      if (e.key === "b" || e.key === "B") {
        e.preventDefault();
        const unbanked = players.filter((p) => !bankedThisRound.includes(p.id) && !p.isGhost);
        if (unbanked.length > 0) {
          playBankSound();
          triggerHaptic("light");
          handleBank(unbanked[0].id);
        }
      }

      const num = parseInt(e.key);
      if (num >= 1 && num <= 9 && num <= players.length) {
        const player = players[num - 1];
        if (!player.isGhost && !bankedThisRound.includes(player.id)) {
          e.preventDefault();
          playBankSound();
          triggerHaptic("light");
          handleBank(player.id);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, canBank, players, bankedThisRound, handleBank]);

  const onBank = (playerId: string) => {
    playBankSound();
    triggerHaptic("light");
    handleBank(playerId);
  };

  return (
    <div className="w-full space-y-2">
      <div className="space-y-2">
        {visiblePlayers.map((player, idx) => {
          const hasBanked = bankedThisRound.includes(player.id);
          const rank = rankMap.get(player.id);
          const isCurrentRoller = currentRoller?.id === player.id && !isBust;

          if (mode === "leaderboard") {
            return (
              <motion.div
                key={player.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`flex items-center gap-3 rounded-xl p-3 transition-all duration-300 ${
                  player.isGhost ? "opacity-70" : ""
                } ${
                  hasBanked
                    ? "bg-emerald-500/10 border border-emerald-500/20"
                    : isCurrentRoller
                      ? "bg-indigo-500/10 border border-indigo-500/30"
                      : "bg-white/5 border border-white/10"
                }`}
              >
                <div className="relative">
                  <PlayerAvatar color={player.color} isGhost={player.isGhost} rank={rank} name={player.name} />
                  {isCurrentRoller && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center"
                    >
                      <Dices className="w-2.5 h-2.5 text-white" />
                    </motion.div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white truncate">{player.isGhost ? "Ghost" : player.name}</div>
                </div>
                {hasBanked && (
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
                {!player.isGhost && (
                  <div className="text-right shrink-0">
                    <div className="text-lg font-black tabular-nums text-white">{player.score}</div>
                  </div>
                )}
              </motion.div>
            );
          }

          return (
            <motion.div
              key={player.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`flex items-center gap-3 rounded-xl p-3 transition-all duration-300 ${
                player.isGhost ? "opacity-80" : ""
              } ${
                hasBanked
                  ? "bg-emerald-500/10 border border-emerald-500/20"
                  : isCurrentRoller
                    ? "bg-indigo-500/10 border border-indigo-500/30 shadow-md shadow-indigo-500/5"
                    : canBank && !player.isGhost
                      ? "bg-white/5 border border-white/10 hover:border-white/20"
                      : "bg-white/5 border border-white/10"
              }`}
            >
              {/* Avatar with optional roller dice icon */}
              <div className="relative">
                <PlayerAvatar color={player.color} isGhost={player.isGhost} rank={rank} name={player.name} />
                {isCurrentRoller && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center"
                  >
                    <Dices className="w-2.5 h-2.5 text-white" />
                  </motion.div>
                )}
              </div>

              {/* Player name */}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white truncate flex items-center gap-1.5">
                  {player.isGhost ? "Ghost" : player.name}
                </div>
              </div>

              {/* Bank button or "Banked" badge */}
              {phase === "playing" && (
                <>
                  {hasBanked ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-1 text-emerald-400 text-sm"
                    >
                      <Check className="w-4 h-4" />
                      <span>Banked</span>
                    </motion.div>
                  ) : !player.isGhost && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        disabled={!canBank}
                        onClick={() => onBank(player.id)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white disabled:bg-gray-800 disabled:text-gray-500"
                      >
                        <Landmark className="w-3.5 h-3.5" />
                        <span className="ml-1">{bank > 0 ? `+${bank}` : "Bank"}</span>
                      </Button>
                      <span className="text-[10px] text-gray-600 font-mono">{idx + 1}</span>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
