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
        className="w-9 h-9 md:w-11 md:h-11 rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: color }}
      >
        <Ghost className="w-5 h-5 md:w-6 md:h-6 text-white" />
      </div>
    );
  }
  return (
    <div
      className="w-9 h-9 md:w-11 md:h-11 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
      style={{ backgroundColor: color }}
    >
      <span className="text-[11px] md:text-xs font-black leading-none">{rank != null ? ordinal(rank) : "—"}</span>
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
  const rollCount = useGameStore((s) => s.rollCount);
  const lastDie1 = useGameStore((s) => s.lastDie1);
  const lastDie2 = useGameStore((s) => s.lastDie2);

  const visiblePlayers = players;

  // Card size tier based on player count — fewer players = larger cards
  const n = visiblePlayers.length;
  const cardPadding = n <= 5 ? "p-3 md:p-5 xl:p-6 2xl:p-8" : n <= 7 ? "p-3 md:p-4 xl:p-5" : "p-2 md:p-3 xl:p-4";
  const nameSize   = n <= 5 ? "text-3xl md:text-4xl xl:text-5xl 2xl:text-6xl" : n <= 7 ? "text-2xl md:text-3xl xl:text-4xl 2xl:text-5xl" : "text-xl md:text-2xl xl:text-3xl 2xl:text-4xl";
  const rankSize   = n <= 5 ? "text-base md:text-3xl xl:text-4xl 2xl:text-5xl" : n <= 7 ? "text-base md:text-2xl xl:text-3xl 2xl:text-4xl" : "text-sm md:text-xl xl:text-2xl 2xl:text-3xl";
  const scoreSize  = n <= 5 ? "text-xl md:text-4xl xl:text-5xl 2xl:text-6xl" : n <= 7 ? "text-lg md:text-3xl xl:text-4xl 2xl:text-5xl" : "text-base md:text-2xl xl:text-3xl 2xl:text-4xl";
  const rankSlot   = n <= 5 ? "w-10 md:w-20 xl:w-28 2xl:w-36" : n <= 7 ? "w-10 md:w-16 xl:w-20 2xl:w-24" : "w-8 md:w-14 xl:w-18 2xl:w-20";
  const scoreSlot  = n <= 5 ? "w-10 md:w-36 xl:w-44 2xl:w-56" : n <= 7 ? "w-10 md:w-28 xl:w-36 2xl:w-44" : "w-10 md:w-24 xl:w-28 2xl:w-36";
  const checkSize  = n <= 5 ? "w-4 h-4 md:w-6 md:h-6 xl:w-7 xl:h-7" : n <= 7 ? "w-4 h-4 md:w-5 md:h-5 xl:w-6 xl:h-6" : "w-3.5 h-3.5 md:w-4 md:h-4 xl:w-5 xl:h-5";
  const cardGap    = n <= 5 ? "gap-3 md:gap-5 xl:gap-7" : n <= 7 ? "gap-3 md:gap-4 xl:gap-5" : "gap-2 md:gap-3 xl:gap-4";
  const ghostIcon  = n <= 5 ? "w-6 h-6 md:w-9 md:h-9 xl:w-12 xl:h-12" : n <= 7 ? "w-5 h-5 md:w-7 md:h-7 xl:w-9 xl:h-9" : "w-4 h-4 md:w-6 md:h-6 xl:w-7 xl:h-7";

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
    <div className={`w-full ${mode === "leaderboard" ? `grid grid-cols-1 pt-2 ${n <= 5 ? "gap-2 md:gap-3 xl:gap-4 2xl:gap-5" : n <= 7 ? "gap-2 md:gap-2.5 xl:gap-3" : "gap-1.5 md:gap-2 xl:gap-2.5"}` : "space-y-2"}`}>
        {visiblePlayers.map((player, idx) => {
          const hasBanked = bankedThisRound.includes(player.id);
          const rank = rankMap.get(player.id);
          const isCurrentRoller = currentRoller?.id === player.id && !isBust;

          if (mode === "leaderboard") {
            const rankColor =
              rank === 1 ? "text-amber-400" :
              rank === 2 ? "text-slate-300" :
              rank === 3 ? "text-orange-400" :
              "text-white/60";
            return (
              <motion.div
                key={player.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`relative flex items-center ${cardGap} rounded-xl ${cardPadding} transition-all duration-300 border overflow-hidden ${player.isGhost ? "opacity-70" : ""}`}
                style={{
                  backgroundColor: hasBanked ? player.color + "30" : player.color + "55",
                  borderColor: hasBanked ? player.color + "70" : player.color + "cc",
                }}
              >
                {/* Pulsing color overlay for current roller */}
                {isCurrentRoller && (
                  <motion.div
                    className="absolute inset-0 rounded-xl pointer-events-none"
                    animate={{ opacity: [0.25, 0.55, 0.25] }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                    style={{ backgroundColor: player.color }}
                  />
                )}

                {/* Left slot: rank ordinal or ghost icon */}
                <div className={`${rankSlot} shrink-0 flex items-center justify-center`}>
                  {player.isGhost
                    ? <Ghost className={`${ghostIcon} text-white/80`} />
                    : <span className={`${rankSize} font-black tracking-tight ${rankColor}`}>
                        {rank != null ? ordinal(rank) : "—"}
                      </span>
                  }
                </div>

                {/* Center: name or "Ghost" text */}
                <div className="flex-1 min-w-0 flex items-center">
                  <div className={`${nameSize} font-bold text-white truncate`}>
                    {player.isGhost ? "Ghost" : player.name}
                  </div>
                </div>

                {/* Right slot: check + score or empty spacer for alignment */}
                <div className={`${scoreSlot} shrink-0 flex items-center justify-end gap-2`}>
                  {hasBanked && <Check className={`${checkSize} shrink-0 text-emerald-400`} />}
                  {!player.isGhost && (
                    <div className={`${scoreSize} font-black tabular-nums text-white`}>{player.score}</div>
                  )}
                </div>
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
              className={`flex items-center gap-3 rounded-xl p-3 transition-all duration-300 border ${player.isGhost ? "opacity-80" : ""}`}
              style={{
                backgroundColor: hasBanked ? player.color + "30" : player.color + "55",
                borderColor: hasBanked ? player.color + "70" : player.color + "cc",
              }}
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
                <div className="text-3xl font-bold text-white truncate flex items-center gap-1.5">
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
  );
}
