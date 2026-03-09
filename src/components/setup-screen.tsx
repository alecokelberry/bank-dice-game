"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store/game-store";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Play, ArrowUp, ArrowDown } from "lucide-react";

export function SetupScreen() {
  const players = useGameStore((s) => s.players);
  const totalRounds = useGameStore((s) => s.totalRounds);
  const addPlayer = useGameStore((s) => s.addPlayer);
  const removePlayer = useGameStore((s) => s.removePlayer);
  const renamePlayer = useGameStore((s) => s.renamePlayer);
  const reorderPlayers = useGameStore((s) => s.reorderPlayers);
  const setTotalRounds = useGameStore((s) => s.setTotalRounds);
  const startGame = useGameStore((s) => s.startGame);

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

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 gap-6 max-w-sm mx-auto w-full">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-5xl font-black text-white tracking-tight mb-1">BANK!</h1>
        <p className="text-gray-400 text-sm">The dice game of risk & reward</p>
      </motion.div>

      {/* Round count selector */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full"
      >
        <label className="block text-sm font-medium text-gray-400 mb-2 text-center">
          Rounds
        </label>
        <div className="flex gap-2 justify-center">
          {[10, 15, 20].map((n) => (
            <Button
              key={n}
              variant={totalRounds === n ? "default" : "outline"}
              size="lg"
              onClick={() => setTotalRounds(n)}
              className={totalRounds === n ? "bg-indigo-600 hover:bg-indigo-500 text-white" : ""}
            >
              {n}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Player list with turn order controls */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full"
      >
        <label className="block text-sm font-medium text-gray-400 mb-2 text-center">
          Turn Order ({players.length} total)
          {players.length > 1 && (
            <span className="text-gray-600 text-xs ml-2">tap arrows to reorder</span>
          )}
        </label>

        <div className="space-y-2 mb-3">
          <AnimatePresence initial={false}>
            {players.map((p, idx) => (
              <motion.div
                key={p.id}
                layout
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
                className="flex items-center gap-2 border rounded-xl px-3 py-2.5 transition-colors bg-white/5 border-white/10"
              >
                {/* Reorder arrows */}
                <div className="flex flex-col shrink-0">
                  <button
                    onClick={() => idx > 0 && reorderPlayers(idx, idx - 1)}
                    disabled={idx === 0}
                    className="text-gray-500 hover:text-white disabled:opacity-20 disabled:pointer-events-none cursor-pointer p-0.5"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => idx < players.length - 1 && reorderPlayers(idx, idx + 1)}
                    disabled={idx === players.length - 1}
                    className="text-gray-500 hover:text-white disabled:opacity-20 disabled:pointer-events-none cursor-pointer p-0.5"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Player avatar */}
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                  style={{ backgroundColor: p.color }}
                >
                  {p.name.slice(0, 2).toUpperCase()}
                </div>

                {/* Inline rename on double-click */}
                {editingId === p.id ? (
                  <input
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={() => {
                      if (editName.trim()) renamePlayer(p.id, editName.trim());
                      setEditingId(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        if (editName.trim()) renamePlayer(p.id, editName.trim());
                        setEditingId(null);
                      }
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="flex-1 bg-white/10 border border-indigo-500 rounded px-2 py-0.5 text-sm text-white focus:outline-none"
                    maxLength={20}
                  />
                ) : (
                  <span
                    className="flex-1 font-medium text-sm text-white"
                    onDoubleClick={() => {
                      setEditingId(p.id);
                      setEditName(p.name);
                    }}
                  >
                    {p.name}
                  </span>
                )}

                <button
                  onClick={() => removePlayer(p.id)}
                  className="text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Add player input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddPlayer()}
            placeholder="Enter player name..."
            className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
            maxLength={20}
            autoFocus
          />
          <Button
            variant="default"
            size="icon"
            onClick={handleAddPlayer}
            disabled={!newName.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 text-white h-12 w-12"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </motion.div>

      {/* Start game button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Button
          variant="default"
          size="lg"
          onClick={startGame}
          disabled={players.length < 2}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xl px-12 py-6 h-auto disabled:bg-gray-700 disabled:text-gray-500"
        >
          <Play className="w-6 h-6 mr-2" />
          Start Game
        </Button>
        {players.length < 2 && (
          <p className="text-gray-500 text-sm text-center mt-2">Add at least 2 players</p>
        )}
      </motion.div>
    </div>
  );
}
