"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store/game-store";
import { Dialog, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Play, ArrowUp, ArrowDown } from "lucide-react";

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

  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

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
            <p className="text-xs text-gray-600 mt-1">Can&apos;t change rounds during a game</p>
          )}
        </div>

        {/* Turn order and player management */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Turn Order ({players.length} total)
            {phase === "setup" && players.length > 1 && (
              <span className="text-gray-600 text-xs ml-2">tap arrows to reorder</span>
            )}
            {phase !== "setup" && (
              <span className="text-gray-600 text-xs ml-2">locked during game</span>
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
                    {p.name.slice(0, 2).toUpperCase()}
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
                      className="flex-1 text-sm text-white"
                      onDoubleClick={() => {
                        setEditingId(p.id);
                        setEditName(p.name);
                      }}
                    >
                      {p.name}
                    </span>
                  )}

                  {phase === "setup" && (
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
