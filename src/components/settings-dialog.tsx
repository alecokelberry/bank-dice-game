"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store/game-store";
import { Dialog, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Play, ArrowUp, ArrowDown, Ghost, Zap, ChevronDown } from "lucide-react";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Mid-game settings dialog for viewing/modifying players and round count. */
export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const players = useGameStore((s) => s.players);
  const totalRounds = useGameStore((s) => s.totalRounds);
  const addPlayer = useGameStore((s) => s.addPlayer);
  const removePlayer = useGameStore((s) => s.removePlayer);
  const reorderPlayers = useGameStore((s) => s.reorderPlayers);
  const renamePlayer = useGameStore((s) => s.renamePlayer);
  const setTotalRounds = useGameStore((s) => s.setTotalRounds);
  const startGame = useGameStore((s) => s.startGame);
  const phase = useGameStore((s) => s.phase);
  const ghostRollsPerRound = useGameStore((s) => s.ghostRollsPerRound);
  const setGhostCount = useGameStore((s) => s.setGhostCount);
  const setGhostRollsPerRound = useGameStore((s) => s.setGhostRollsPerRound);
  const roundEventsEnabled = useGameStore((s) => s.roundEventsEnabled);
  const setRoundEventsEnabled = useGameStore((s) => s.setRoundEventsEnabled);

  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [isGameModesOpen, setIsGameModesOpen] = useState(false);

  const ghostCount = players.filter((p) => p.isGhost).length;

  const handleAddPlayer = () => {
    const name = newName.trim();
    if (name) {
      addPlayer(name);
      setNewName("");
    }
  };

  const handleStart = () => {
    startGame();
    onOpenChange(false);
  };

  const saveEdit = (id: string) => {
    if (editName.trim()) renamePlayer(id, editName);
    setEditingId(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTitle>Game Settings</DialogTitle>

      <div className="max-h-[70vh] overflow-y-auto space-y-5 -mx-1 px-1">
        {/* Round count — locked during an active game */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Total Rounds</label>
          <div className="flex gap-2">
            {[10, 15, 20].map((n) => (
              <Button
                key={n}
                variant={totalRounds === n ? "default" : "outline"}
                size="sm"
                onClick={() => setTotalRounds(n)}
                disabled={phase !== "setup"}
                className={totalRounds === n ? "bg-indigo-600 hover:bg-indigo-500 text-white" : ""}
              >
                {n}
              </Button>
            ))}
          </div>
          {phase !== "setup" && (
            <p className="text-xs text-gray-500 mt-1">Can&apos;t change rounds during a game</p>
          )}
        </div>

        {/* Game Modes */}
        <div className="pt-2 border-t border-white/10">
          <button
            onClick={() => setIsGameModesOpen(!isGameModesOpen)}
            className="w-full flex items-center justify-between group cursor-pointer outline-none"
          >
            <label className="block text-sm font-medium text-gray-400 group-hover:text-indigo-400 transition-colors cursor-pointer">Game Modes</label>
            <ChevronDown className={`w-4 h-4 text-gray-400 group-hover:text-indigo-400 transition-transform duration-200 ${isGameModesOpen ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {isGameModesOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-3 space-y-3">
                  {/* Round Events */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <div>
                        <p className="text-sm text-white leading-tight">Round Events</p>
                        <p className="text-[11px] text-gray-400">A random event each round</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={roundEventsEnabled}
                      disabled={phase !== "setup"}
                      onClick={() => setRoundEventsEnabled(!roundEventsEnabled)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${roundEventsEnabled ? "bg-amber-500" : "bg-white/20"}`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${roundEventsEnabled ? "translate-x-4" : "translate-x-0"}`} />
                    </button>
                  </div>

                  {/* Ghost Players */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Ghost className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                      <div>
                        <p className="text-sm text-white leading-tight">Ghost Players</p>
                        <p className="text-[11px] text-gray-400">Automated AI players</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={ghostCount > 0}
                      disabled={phase !== "setup"}
                      onClick={() => setGhostCount(ghostCount > 0 ? 0 : 1)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${ghostCount > 0 ? "bg-violet-500" : "bg-white/20"}`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${ghostCount > 0 ? "translate-x-4" : "translate-x-0"}`} />
                    </button>
                  </div>

                  <AnimatePresence>
                    {ghostCount > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3 overflow-hidden"
                      >
                        {/* Number of ghosts — segmented pills */}
                        <div>
                          <p className="text-xs text-gray-400 mb-1.5">Number of ghosts</p>
                          <div className="flex gap-1.5">
                            {[1, 2, 3, 4].map((n) => (
                              <button
                                key={n}
                                disabled={phase !== "setup"}
                                onClick={() => setGhostCount(n)}
                                className={`flex-1 py-1.5 rounded-lg text-sm font-bold transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none ${
                                  ghostCount === n
                                    ? "bg-violet-500 text-white shadow-sm shadow-violet-500/30 scale-105"
                                    : "bg-white/10 text-gray-400 hover:bg-white/20"
                                }`}
                              >
                                {n}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Rolls per round — stepper */}
                        <div>
                          <p className="text-xs text-gray-400 mb-1.5">Rolls per round</p>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setGhostRollsPerRound(ghostRollsPerRound === null ? 10 : Math.max(1, ghostRollsPerRound - 1))}
                              disabled={ghostRollsPerRound !== null && ghostRollsPerRound <= 1}
                              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-300 hover:bg-violet-900/30 hover:text-violet-400 transition-all disabled:opacity-30 disabled:pointer-events-none text-lg font-bold leading-none"
                            >
                              −
                            </button>
                            <div className="flex-1 text-center">
                              <span className="text-base font-bold text-white tabular-nums">
                                {ghostRollsPerRound === null ? "All" : ghostRollsPerRound}
                              </span>
                            </div>
                            <button
                              onClick={() => setGhostRollsPerRound(ghostRollsPerRound === null ? null : ghostRollsPerRound >= 10 ? null : ghostRollsPerRound + 1)}
                              disabled={ghostRollsPerRound === null}
                              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-300 hover:bg-violet-900/30 hover:text-violet-400 transition-all disabled:opacity-30 disabled:pointer-events-none text-lg font-bold leading-none"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {phase !== "setup" && (
                    <p className="text-xs text-gray-500 mt-1">Can&apos;t clear/modify ghosts mid-game</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Turn order and player management */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Turn Order ({players.length} total)
            {phase === "setup" && players.length > 1 && (
              <span className="text-gray-500 text-xs ml-2">tap arrows to reorder</span>
            )}
            {phase !== "setup" && (
              <span className="text-gray-500 text-xs ml-2">locked during game</span>
            )}
          </label>
          <div className="space-y-1.5 max-h-56 overflow-y-auto">
            <AnimatePresence initial={false}>
              {players.map((p, idx) => (
                <motion.div
                  key={p.id}
                  layout
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-2 transition-colors bg-white/5 border border-white/10"
                >
                  {/* Reorder arrows */}
                  <div className="flex flex-col shrink-0">
                    <button
                      onClick={() => idx > 0 && reorderPlayers(idx, idx - 1)}
                      disabled={phase !== "setup" || idx === 0}
                      className="text-gray-500 hover:text-white disabled:opacity-20 disabled:pointer-events-none cursor-pointer p-0.5"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => idx < players.length - 1 && reorderPlayers(idx, idx + 1)}
                      disabled={phase !== "setup" || idx === players.length - 1}
                      className="text-gray-500 hover:text-white disabled:opacity-20 disabled:pointer-events-none cursor-pointer p-0.5"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>

                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                    style={{ backgroundColor: p.color }}
                  >
                    {p.isGhost ? <Ghost className="w-3 h-3" /> : p.name.slice(0, 2).toUpperCase()}
                  </div>

                  {editingId === p.id ? (
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={() => saveEdit(p.id)}
                      onKeyDown={(e) => e.key === "Enter" && saveEdit(p.id)}
                      className="flex-1 bg-white/10 rounded px-2 py-0.5 text-white text-sm focus:outline-none"
                      maxLength={20}
                    />
                  ) : (
                    <span
                      className="flex-1 text-sm text-white flex items-center gap-1.5"
                      onDoubleClick={() => {
                        setEditingId(p.id);
                        setEditName(p.name);
                      }}
                    >
                      {p.name}
                    </span>
                  )}

                  {phase === "setup" && !p.isGhost && (
                    <button
                      onClick={() => removePlayer(p.id)}
                      className="text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {phase === "setup" && (
            <div className="flex gap-2 mt-3">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddPlayer()}
                placeholder="Player name..."
                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                maxLength={20}
              />
              <Button
                variant="default"
                size="icon"
                onClick={handleAddPlayer}
                disabled={!newName.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white shrink-0"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {phase === "setup" && (
          <>
            <Button
              variant="default"
              size="lg"
              onClick={handleStart}
              disabled={players.length < 2}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-lg"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Game
            </Button>
            {players.length < 2 && (
              <p className="text-gray-500 text-sm text-center">
                Add at least 2 players to start
              </p>
            )}
          </>
        )}
      </div>
    </Dialog>
  );
}
