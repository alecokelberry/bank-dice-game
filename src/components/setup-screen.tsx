"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store/game-store";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Play, ArrowUp, ArrowDown, Ghost, Zap, ChevronDown } from "lucide-react";

export function SetupScreen() {
  const players = useGameStore((s) => s.players);
  const totalRounds = useGameStore((s) => s.totalRounds);
  const addPlayer = useGameStore((s) => s.addPlayer);
  const removePlayer = useGameStore((s) => s.removePlayer);
  const renamePlayer = useGameStore((s) => s.renamePlayer);
  const reorderPlayers = useGameStore((s) => s.reorderPlayers);
  const setTotalRounds = useGameStore((s) => s.setTotalRounds);
  const startGame = useGameStore((s) => s.startGame);
  const ghostsActiveUntilRound = useGameStore((s) => s.ghostsActiveUntilRound);
  const setGhostCount = useGameStore((s) => s.setGhostCount);
  const setGhostsActiveUntilRound = useGameStore((s) => s.setGhostsActiveUntilRound);
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

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] py-10 px-6 gap-7 max-w-sm mx-auto w-full">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-2"
      >
        <h1 className="text-6xl font-black tracking-tight mb-2 bg-gradient-to-br from-indigo-600 via-purple-600 to-emerald-500 bg-clip-text text-transparent drop-shadow-sm">BANK!</h1>
        <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">The dice game of risk & reward</p>
      </motion.div>

      {/* Round count selector */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full"
      >
        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 text-center uppercase tracking-wider">
          Total Rounds
        </label>
        <div className="flex gap-3 justify-center">
          {[10, 15, 20].map((n) => (
            <Button
              key={n}
              variant={totalRounds === n ? "default" : "outline"}
              size="lg"
              onClick={() => setTotalRounds(n)}
              className={`w-20 transition-all duration-300 ${
                totalRounds === n 
                  ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 border-transparent scale-105" 
                  : "bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-white/10"
              }`}
            >
              <span className="text-lg font-bold">{n}</span>
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Game Mode Toggles */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="w-full bg-white/60 dark:bg-gray-900/60 backdrop-blur-md border border-gray-200/60 dark:border-gray-700/50 shadow-xl shadow-black/[0.03] dark:shadow-black/20 rounded-2xl p-5 overflow-hidden"
      >
        <button
          onClick={() => setIsGameModesOpen(!isGameModesOpen)}
          className="w-full flex items-center justify-between group cursor-pointer outline-none"
        >
          <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Game Modes</h2>
          <ChevronDown className={`w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-transform duration-200 ${isGameModesOpen ? "rotate-180" : ""}`} />
        </button>

        <AnimatePresence>
          {isGameModesOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="pt-4 space-y-2">
                {/* Round Events toggle */}
                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2.5">
                    <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight">Round Events</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={roundEventsEnabled}
                    onClick={() => setRoundEventsEnabled(!roundEventsEnabled)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900 ${roundEventsEnabled ? "bg-amber-500" : "bg-black/10 dark:bg-white/20"}`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${roundEventsEnabled ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>

                <div className="border-t border-black/10 dark:border-white/10" />

                {/* Ghost Players toggle */}
                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2.5">
                    <Ghost className="w-4 h-4 text-violet-400 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight">Ghost Players</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={ghostCount > 0}
                    onClick={() => setGhostCount(ghostCount > 0 ? 0 : 1)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900 ${ghostCount > 0 ? "bg-violet-500" : "bg-black/10 dark:bg-white/20"}`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${ghostCount > 0 ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>

                <AnimatePresence>
                  {ghostCount > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-4 pt-4 mt-4 border-t border-black/10 dark:border-white/10">
                        {/* Number of ghosts slider */}
                        <div className="px-1">
                          <div className="flex justify-between text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                            <span>Number of ghosts</span>
                            <span className="text-gray-900 dark:text-white font-bold">{ghostCount}</span>
                          </div>
                          <input
                            type="range"
                            min={1}
                            max={4}
                            value={ghostCount}
                            onChange={(e) => setGhostCount(parseInt(e.target.value))}
                            className="w-full h-2 bg-black/10 dark:bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-violet-500 [&::-webkit-slider-thumb]:rounded-full [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-violet-500 [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:rounded-full"
                          />
                          <div className="flex justify-between text-[10px] text-gray-500 dark:text-gray-500 mt-1">
                            <span>1</span>
                            <span>4</span>
                          </div>
                        </div>

                        {/* Active until round slider */}
                        <div className="px-1">
                          <div className="flex justify-between text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                            <span>Active until round</span>
                            <span className="text-gray-900 dark:text-white font-bold">
                              {ghostsActiveUntilRound === totalRounds ? "All" : ghostsActiveUntilRound}
                            </span>
                          </div>
                          <input
                            type="range"
                            min={1}
                            max={totalRounds}
                            value={ghostsActiveUntilRound}
                            onChange={(e) => setGhostsActiveUntilRound(parseInt(e.target.value))}
                            className="w-full h-2 bg-black/10 dark:bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-violet-500 [&::-webkit-slider-thumb]:rounded-full [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-violet-500 [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:rounded-full"
                          />
                          <div className="flex justify-between text-[10px] text-gray-500 dark:text-gray-500 mt-1">
                            <span>1</span>
                            <span>All ({totalRounds})</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>


      {/* Player list with turn order controls */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full"
      >
        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 text-center uppercase tracking-wider">
          Turn Order ({players.length})
          {players.length > 1 && (
            <span className="text-gray-500 font-normal normal-case text-xs ml-2">tap arrows to reorder</span>
          )}
        </label>

        <div className="space-y-2 mb-3">
          <AnimatePresence initial={false}>
            {players.map((p, idx) => (
              <motion.div
                key={p.id}
                layout
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
                className="flex items-center gap-3 border rounded-xl px-3 py-3 transition-all bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/80 dark:border-gray-700/80 shadow-sm hover:shadow-md dark:shadow-black/20"
              >
                {/* Reorder arrows */}
                <div className="flex flex-col shrink-0">
                  <button
                    onClick={() => idx > 0 && reorderPlayers(idx, idx - 1)}
                    disabled={idx === 0}
                    className="text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white disabled:opacity-20 disabled:pointer-events-none cursor-pointer p-0.5"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => idx < players.length - 1 && reorderPlayers(idx, idx + 1)}
                    disabled={idx === players.length - 1}
                    className="text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white disabled:opacity-20 disabled:pointer-events-none cursor-pointer p-0.5"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Player avatar */}
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 relative"
                  style={{ backgroundColor: p.color }}
                >
                  {p.isGhost ? <Ghost className="w-4 h-4" /> : p.name.slice(0, 2).toUpperCase()}
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
                    className="flex-1 bg-black/10 dark:bg-white/10 border border-indigo-500 rounded px-2 py-0.5 text-sm text-gray-900 dark:text-white focus:outline-none"
                    maxLength={20}
                  />
                ) : (
                  <span
                    className="flex-1 font-medium text-sm text-gray-900 dark:text-white"
                    onDoubleClick={() => {
                      setEditingId(p.id);
                      setEditName(p.name);
                    }}
                  >
                    {p.name}
                  </span>
                )}

                {!p.isGhost && (
                  <button
                    onClick={() => removePlayer(p.id)}
                    className="text-gray-500 dark:text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Add player input */}
        <div className="flex gap-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddPlayer()}
            placeholder="Enter player name..."
            className="flex-1 bg-white dark:bg-gray-900/80 shadow-sm border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3.5 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium"
            maxLength={20}
            autoFocus
          />
          <Button
            variant="default"
            size="icon"
            onClick={handleAddPlayer}
            disabled={!newName.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 text-white h-[52px] w-[52px] rounded-xl shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50 disabled:shadow-none shrink-0"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </div>
      </motion.div>

      {/* Start game button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full mt-2"
      >
        <Button
          variant="default"
          size="lg"
          onClick={startGame}
          disabled={players.length < 2}
          className="w-full relative overflow-hidden group bg-emerald-500 hover:bg-emerald-400 text-white text-xl font-black py-7 rounded-2xl transition-all duration-300 shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)] hover:shadow-[0_0_60px_-15px_rgba(16,185,129,0.7)] hover:-translate-y-1 disabled:bg-gray-800 disabled:text-gray-500 disabled:shadow-none disabled:translate-y-0 disabled:cursor-not-allowed"
        >
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-emerald-400 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <span className="relative flex items-center justify-center">
            <Play className="w-6 h-6 mr-2 fill-current" />
            Start Game
          </span>
        </Button>
        {players.length < 2 && (
          <p className="text-gray-500 dark:text-gray-500 text-sm font-medium text-center mt-3">Add at least 2 players</p>
        )}
      </motion.div>
    </div>
  );
}
