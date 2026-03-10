"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useGameStore, selectCanBank, selectCurrentRoller, SUPERPOWERS } from "@/store/game-store";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTitle } from "@/components/ui/dialog";
import { Landmark, Check, Trophy, Crown, Dices, Ghost, Sparkles } from "lucide-react";
import { playBankSound, playRollSound, triggerHaptic } from "@/lib/sounds";

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
  const currentRound = useGameStore((s) => s.currentRound);
  const ghostsActiveUntilRound = useGameStore((s) => s.ghostsActiveUntilRound);
  const superpowersEnabled = useGameStore((s) => s.superpowersEnabled);
  const superpowersUsedThisRound = useGameStore((s) => s.superpowersUsedThisRound);
  const rollCount = useGameStore((s) => s.rollCount);
  const lastDie1 = useGameStore((s) => s.lastDie1);
  const lastDie2 = useGameStore((s) => s.lastDie2);
  const rerollWithWhisperer = useGameStore((s) => s.rerollWithWhisperer);
  const activeHotStreakPlayerId = useGameStore((s) => s.activeHotStreakPlayerId);
  const activateHotStreak = useGameStore((s) => s.activateHotStreak);
  const deactivateHotStreak = useGameStore((s) => s.deactivateHotStreak);
  const activeAllInPlayerId = useGameStore((s) => s.activeAllInPlayerId);
  const activateAllIn = useGameStore((s) => s.activateAllIn);
  const deactivateAllIn = useGameStore((s) => s.deactivateAllIn);
  const useMirrorMaster = useGameStore((s) => s.useMirrorMaster);
  const useDiceDoctor = useGameStore((s) => s.useDiceDoctor);

  const [whispererPlayerId, setWhispererPlayerId] = useState<string | null>(null);
  const [doctorPlayerId, setDoctorPlayerId] = useState<string | null>(null);

  // Color palette per superpower — full class strings so Tailwind doesn't purge them
  const POWER_STYLES: Record<string, { idle: string; active: string; armed: string }> = {
    second_chance: {
      idle: "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
      active: "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/40 text-emerald-600 dark:text-emerald-400",
      armed: "",
    },
    dice_whisperer: {
      idle: "bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/20 text-violet-600 dark:text-violet-400",
      active: "bg-violet-50 dark:bg-violet-500/10 border-violet-300 dark:border-violet-500/40 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-500/20 cursor-pointer shadow-sm",
      armed: "",
    },
    hot_streak: {
      idle: "bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20 text-orange-600 dark:text-orange-400",
      active: "bg-orange-50 dark:bg-orange-500/10 border-orange-300 dark:border-orange-500/40 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-500/20 cursor-pointer shadow-sm",
      armed: "bg-orange-100 dark:bg-orange-500/20 border-orange-400 dark:border-orange-400/60 text-orange-700 dark:text-orange-300 cursor-pointer shadow-md animate-pulse",
    },
    mirror_master: {
      idle: "bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/20 text-sky-600 dark:text-sky-400",
      active: "bg-sky-50 dark:bg-sky-500/10 border-sky-300 dark:border-sky-500/40 text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-500/20 cursor-pointer shadow-sm",
      armed: "",
    },
    dice_doctor: {
      idle: "bg-teal-50 dark:bg-teal-500/10 border-teal-200 dark:border-teal-500/20 text-teal-600 dark:text-teal-400",
      active: "bg-teal-50 dark:bg-teal-500/10 border-teal-300 dark:border-teal-500/40 text-teal-600 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-500/20 cursor-pointer shadow-sm",
      armed: "",
    },
    bank_parasite: {
      idle: "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400",
      active: "bg-rose-50 dark:bg-rose-500/10 border-rose-300 dark:border-rose-500/40 text-rose-600 dark:text-rose-400",
      armed: "",
    },
    all_in: {
      idle: "bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/20 text-yellow-600 dark:text-yellow-500",
      active: "bg-yellow-50 dark:bg-yellow-500/10 border-yellow-300 dark:border-yellow-500/40 text-yellow-600 dark:text-yellow-500 hover:bg-yellow-100 dark:hover:bg-yellow-500/20 cursor-pointer shadow-sm",
      armed: "bg-yellow-100 dark:bg-yellow-500/20 border-yellow-400 dark:border-yellow-400/60 text-yellow-700 dark:text-yellow-300 cursor-pointer shadow-md animate-pulse",
    },
  };

  // During gameplay, hide ghosts that are past their active round limit.
  const visiblePlayers = players.filter(
    (p) => !p.isGhost || currentRound <= ghostsActiveUntilRound
  );

  const maxScore = Math.max(...visiblePlayers.map((p) => p.score), 0);

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
      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider px-1">
        Players
      </h3>
      <div className="space-y-2">
        {visiblePlayers.map((player, idx) => {
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
                player.isGhost ? "opacity-80" : ""
              } ${
                hasBanked
                  ? "bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20"
                  : isCurrentRoller
                    ? "bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 shadow-md shadow-indigo-500/5"
                    : canBank && !player.isGhost
                      ? "bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20"
                      : "bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10"
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
                    <Dices className="w-2.5 h-2.5 text-gray-900 dark:text-white" />
                  </motion.div>
                )}
              </div>

              {/* Player name and score */}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 dark:text-white truncate flex items-center gap-1.5">
                  {player.isGhost && <Ghost className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400 shrink-0" />}
                  {player.name}
                  {isLeader && <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 tabular-nums">{player.score} pts</div>
                {superpowersEnabled && player.superpower && (() => {
                  const power = SUPERPOWERS.find((sp) => sp.id === player.superpower);
                  const used = superpowersUsedThisRound.includes(player.id);
                  if (!power) return null;
                  const styles = POWER_STYLES[power.id] ?? POWER_STYLES.second_chance;

                  if (used) {
                    return (
                      <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border opacity-40 bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-gray-500">
                        <Sparkles className="w-2.5 h-2.5 shrink-0" />
                        {power.name} (used)
                      </div>
                    );
                  }

                  // Hot Streak: tap to arm before roll, tap again to cancel
                  if (power.id === "hot_streak" && !hasBanked && !player.isGhost) {
                    const isArmed = activeHotStreakPlayerId === player.id;
                    return (
                      <button
                        onClick={() => isArmed ? deactivateHotStreak() : activateHotStreak(player.id)}
                        className={`mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border transition-all ${isArmed ? styles.armed : styles.active}`}
                      >
                        <Sparkles className="w-2.5 h-2.5 shrink-0" />
                        {isArmed ? "🔥 ARMED — tap to cancel" : `${power.name} ✦`}
                      </button>
                    );
                  }

                  // Dice Whisperer: tap after a roll to reroll
                  if (power.id === "dice_whisperer" && !hasBanked && !player.isGhost) {
                    const canActivate = rollCount > 0 && !isBust;
                    return (
                      <button
                        disabled={!canActivate}
                        onClick={canActivate ? () => setWhispererPlayerId(player.id) : undefined}
                        className={`mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border transition-all ${canActivate ? styles.active : styles.idle + " cursor-default"}`}
                      >
                        <Sparkles className="w-2.5 h-2.5 shrink-0" />
                        {canActivate ? `${power.name} ✦` : power.name}
                      </button>
                    );
                  }

                  // Mirror Master: tap after a roll to copy it
                  if (power.id === "mirror_master" && !hasBanked && !player.isGhost) {
                    const canActivate = rollCount > 0 && !isBust && lastDie1 !== null;
                    return (
                      <button
                        disabled={!canActivate}
                        onClick={canActivate ? () => useMirrorMaster(player.id) : undefined}
                        className={`mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border transition-all ${canActivate ? styles.active : styles.idle + " cursor-default"}`}
                      >
                        <Sparkles className="w-2.5 h-2.5 shrink-0" />
                        {canActivate ? `${power.name} ✦` : power.name}
                      </button>
                    );
                  }

                  // Dice Doctor: tap after a roll to adjust a die
                  if (power.id === "dice_doctor" && !hasBanked && !player.isGhost) {
                    const canActivate = rollCount > 0 && !isBust;
                    return (
                      <button
                        disabled={!canActivate}
                        onClick={canActivate ? () => setDoctorPlayerId(player.id) : undefined}
                        className={`mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border transition-all ${canActivate ? styles.active : styles.idle + " cursor-default"}`}
                      >
                        <Sparkles className="w-2.5 h-2.5 shrink-0" />
                        {canActivate ? `${power.name} ✦` : power.name}
                      </button>
                    );
                  }

                  // All-In: tap to arm before roll, tap again to cancel
                  if (power.id === "all_in" && !hasBanked && !player.isGhost) {
                    const isArmed = activeAllInPlayerId === player.id;
                    return (
                      <button
                        onClick={() => isArmed ? deactivateAllIn() : activateAllIn(player.id)}
                        className={`mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border transition-all ${isArmed ? styles.armed : styles.active}`}
                      >
                        <Sparkles className="w-2.5 h-2.5 shrink-0" />
                        {isArmed ? "🎲 ARMED — tap to cancel" : `${power.name} ✦`}
                      </button>
                    );
                  }

                  // Passive powers (Second Chance, Bank Parasite) — just a badge
                  return (
                    <div className={`mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${styles.idle}`}>
                      <Sparkles className="w-2.5 h-2.5 shrink-0" />
                      {power.name}
                    </div>
                  );
                })()}
              </div>

              {/* Bank button or "Banked" badge or "Ghost" label */}
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
                  ) : player.isGhost ? (
                    <div className="flex items-center gap-1 text-gray-500 dark:text-gray-500 text-xs italic pr-2">
                       never banks
                    </div>
                  ) : (
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

      {/* Dice Doctor adjust dialog */}
      <Dialog open={doctorPlayerId !== null} onOpenChange={(open) => { if (!open) setDoctorPlayerId(null); }}>
        <DialogTitle className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-teal-500" /> Dice Doctor
        </DialogTitle>
        {doctorPlayerId && lastDie1 !== null && lastDie2 !== null && (() => {
          const adjustments: Array<{ label: string; d1: number; d2: number }> = [
            ...(lastDie1 < 6 ? [{ label: `Die 1: ${lastDie1} → ${lastDie1 + 1}`, d1: lastDie1 + 1, d2: lastDie2 }] : []),
            ...(lastDie1 > 1 ? [{ label: `Die 1: ${lastDie1} → ${lastDie1 - 1}`, d1: lastDie1 - 1, d2: lastDie2 }] : []),
            ...(lastDie2 < 6 ? [{ label: `Die 2: ${lastDie2} → ${lastDie2 + 1}`, d1: lastDie1, d2: lastDie2 + 1 }] : []),
            ...(lastDie2 > 1 ? [{ label: `Die 2: ${lastDie2} → ${lastDie2 - 1}`, d1: lastDie1, d2: lastDie2 - 1 }] : []),
          ];
          return (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Current roll: <span className="font-bold text-gray-900 dark:text-white">{lastDie1} + {lastDie2} = {lastDie1 + lastDie2}</span>. Nudge one die by ±1:
              </p>
              <div className="grid grid-cols-1 gap-2">
                {adjustments.map(({ label, d1, d2 }) => (
                  <Button
                    key={label}
                    variant="outline"
                    onClick={() => {
                      playRollSound();
                      triggerHaptic("medium");
                      useDiceDoctor(doctorPlayerId, d1, d2);
                      setDoctorPlayerId(null);
                    }}
                    className="w-full justify-start border-teal-200 dark:border-teal-500/20 hover:bg-teal-50 dark:hover:bg-teal-500/10 text-teal-700 dark:text-teal-300"
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-2 shrink-0" />
                    {label} <span className="ml-1 text-gray-500">(= {d1 + d2})</span>
                  </Button>
                ))}
              </div>
              <Button variant="ghost" onClick={() => setDoctorPlayerId(null)} className="w-full text-gray-500">
                Keep Result
              </Button>
            </div>
          );
        })()}
      </Dialog>

      {/* Dice Whisperer reroll dialog */}
      <Dialog open={whispererPlayerId !== null} onOpenChange={(open) => { if (!open) setWhispererPlayerId(null); }}>
        <DialogTitle className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-pink-500" /> Dice Whisperer
        </DialogTitle>
        {whispererPlayerId && lastDie1 !== null && lastDie2 !== null && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Current roll: <span className="font-bold text-gray-900 dark:text-white">{lastDie1} + {lastDie2} = {lastDie1 + lastDie2}</span>. Which dice do you want to reroll?
            </p>
            <div className="grid grid-cols-1 gap-2">
              {[
                { label: `Reroll Die 1 (${lastDie1})`, newDie1: () => Math.floor(Math.random() * 6) + 1, newDie2: () => lastDie2! },
                { label: `Reroll Die 2 (${lastDie2})`, newDie1: () => lastDie1!, newDie2: () => Math.floor(Math.random() * 6) + 1 },
                { label: "Reroll Both", newDie1: () => Math.floor(Math.random() * 6) + 1, newDie2: () => Math.floor(Math.random() * 6) + 1 },
              ].map(({ label, newDie1, newDie2 }) => (
                <Button
                  key={label}
                  variant="outline"
                  onClick={() => {
                    playRollSound();
                    triggerHaptic("medium");
                    rerollWithWhisperer(whispererPlayerId, newDie1(), newDie2());
                    setWhispererPlayerId(null);
                  }}
                  className="w-full justify-start border-pink-200 dark:border-pink-500/20 hover:bg-pink-50 dark:hover:bg-pink-500/10 text-pink-700 dark:text-pink-300"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-2 shrink-0" />
                  {label}
                </Button>
              ))}
            </div>
            <Button
              variant="ghost"
              onClick={() => setWhispererPlayerId(null)}
              className="w-full text-gray-500"
            >
              Keep Result
            </Button>
          </div>
        )}
      </Dialog>
    </div>
  );
}
