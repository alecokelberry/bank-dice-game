"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useGameStore, selectCanBank, selectCurrentRoller } from "@/store/game-store";
import { Button } from "@/components/ui/button";
import { Landmark, Check, Trophy, Crown, Dices } from "lucide-react";
import { playBankSound, triggerHaptic } from "@/lib/sounds";

/** Circular avatar showing player initials on their assigned color. */
function PlayerAvatar({ name, color }: { name: string; color: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  );
}

export function PlayerList() {
  const players = useGameStore((s) => s.players);
  const bankedThisRound = useGameStore((s) => s.bankedThisRound);
  const handleBank = useGameStore((s) => s.handleBank);
  const canBank = useGameStore(selectCanBank);
  const bank = useGameStore((s) => s.bank);
  const phase = useGameStore((s) => s.phase);
  const currentRoller = useGameStore(selectCurrentRoller);
  const isBust = useGameStore((s) => s.isBust);

  const maxScore = Math.max(...players.map((p) => p.score), 0);

  // Keyboard shortcuts: B = bank first unbanked player, 1-9 = bank specific player
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (phase !== "playing" || !canBank) return;

      if (e.key === "b" || e.key === "B") {
        e.preventDefault();
        const unbanked = players.filter((p) => !bankedThisRound.includes(p.id));
        if (unbanked.length > 0) {
          playBankSound();
          triggerHaptic("light");
          handleBank(unbanked[0].id);
        }
      }

      const num = parseInt(e.key);
      if (num >= 1 && num <= 9 && num <= players.length) {
        const player = players[num - 1];
        if (!bankedThisRound.includes(player.id)) {
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
      <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider px-1">
        Players
      </h3>
      <div className="space-y-2">
        {players.map((player, idx) => {
          const hasBanked = bankedThisRound.includes(player.id);
          const isLeader = player.score > 0 && player.score === maxScore;
          const isCurrentRoller = currentRoller?.id === player.id && !isBust;

          return (
            <motion.div
              key={player.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`flex items-center gap-3 rounded-xl p-3 transition-all duration-300 ${
                hasBanked
                  ? "bg-emerald-500/10 border border-emerald-500/20"
                  : isCurrentRoller
                    ? "bg-indigo-500/10 border border-indigo-500/30 shadow-md shadow-indigo-500/5"
                    : canBank
                      ? "bg-white/5 border border-white/10 hover:border-white/20"
                      : "bg-white/5 border border-white/10"
              }`}
            >
              {/* Avatar with optional leader crown or roller dice icon */}
              <div className="relative">
                <PlayerAvatar name={player.name} color={player.color} />
                {isLeader && (
                  <motion.div
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="absolute -top-2 -right-2"
                  >
                    <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />
                  </motion.div>
                )}
                {isCurrentRoller && !isLeader && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center"
                  >
                    <Dices className="w-2.5 h-2.5 text-white" />
                  </motion.div>
                )}
              </div>

              {/* Player name and score */}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white truncate flex items-center gap-1.5">
                  {player.name}
                  {isLeader && <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                </div>
                <div className="text-sm text-gray-400 tabular-nums">{player.score} pts</div>
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
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        disabled={!canBank}
                        onClick={() => onBank(player.id)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white disabled:bg-gray-700 disabled:text-gray-500"
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
