"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store/game-store";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, Play, ArrowUp, ArrowDown, Ghost, ChevronDown, Sparkles, Flame, Shield, Cloud, Star, Timer, Bomb, Zap } from "lucide-react";

export function SetupScreen() {
  const players = useGameStore((s) => s.players);
  const totalRounds = useGameStore((s) => s.totalRounds);
  const addPlayer = useGameStore((s) => s.addPlayer);
  const removePlayer = useGameStore((s) => s.removePlayer);
  const renamePlayer = useGameStore((s) => s.renamePlayer);
  const reorderPlayers = useGameStore((s) => s.reorderPlayers);
  const recolorPlayer = useGameStore((s) => s.recolorPlayer);
  const setTotalRounds = useGameStore((s) => s.setTotalRounds);
  const startGame = useGameStore((s) => s.startGame);
  const ghostRollsPerRound = useGameStore((s) => s.ghostRollsPerRound);
  const setGhostCount = useGameStore((s) => s.setGhostCount);
  const setGhostRollsPerRound = useGameStore((s) => s.setGhostRollsPerRound);
  const roundEventsEnabled = useGameStore((s) => s.roundEventsEnabled);
  const setRoundEventsEnabled = useGameStore((s) => s.setRoundEventsEnabled);

  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [colorPickerId, setColorPickerId] = useState<string | null>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  const COLOR_PALETTE = [
    "#ef4444","#f97316","#eab308","#84cc16",
    "#22c55e","#14b8a6","#06b6d4","#3b82f6",
    "#6366f1","#a855f7","#ec4899","#f43f5e",
  ];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setColorPickerId(null);
      }
    };
    if (colorPickerId) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [colorPickerId]);
  const [isGameModesOpen, setIsGameModesOpen] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [ghostModalOpen, setGhostModalOpen] = useState(false);

  const ghostCount = players.filter((p) => p.isGhost).length;

  const handleAddPlayer = () => {
    const name = newName.trim();
    if (name) {
      addPlayer(name);
      setNewName("");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-10 px-6 gap-7 max-w-sm mx-auto w-full">
      {/* BANK! Title */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, type: "spring", stiffness: 200 }}
        className="text-center select-none"
      >
        <h1 className="text-8xl font-black tracking-tight leading-none bg-gradient-to-br from-white via-indigo-200 to-violet-500 bg-clip-text text-transparent drop-shadow-[0_0_48px_rgba(139,92,246,0.45)]">
          BANK!
        </h1>
      </motion.div>

      {/* Round count selector */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full"
      >
        <label className="block text-sm font-bold text-gray-300 mb-3 text-center uppercase tracking-wider">
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
                  : "bg-white/5 hover:bg-white/10 text-gray-300 border-white/10"
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
        className="w-full bg-gray-900/60 backdrop-blur-md border border-gray-700/50 shadow-xl shadow-black/20 rounded-2xl p-5 overflow-hidden"
      >
        <button
          onClick={() => setIsGameModesOpen(!isGameModesOpen)}
          className="w-full flex items-center justify-between group cursor-pointer outline-none"
        >
          <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wider group-hover:text-indigo-400 transition-colors">Game Modes</h2>
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
                  <button
                    type="button"
                    onClick={() => setEventModalOpen(true)}
                    className="flex items-center gap-2.5 hover:opacity-70 transition-opacity"
                  >
                    <Sparkles className="w-4 h-4 text-white shrink-0" />
                    <p className="text-sm font-medium text-white leading-tight">Round Events</p>
                  </button>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={roundEventsEnabled}
                    onClick={() => setRoundEventsEnabled(!roundEventsEnabled)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 ${roundEventsEnabled ? "bg-fuchsia-500" : "bg-white/20"}`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${roundEventsEnabled ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>

                <div className="border-t border-white/10" />

                {/* Ghost Players toggle */}
                <div className="flex items-center justify-between py-1">
                  <button
                    type="button"
                    onClick={() => setGhostModalOpen(true)}
                    className="flex items-center gap-2.5 hover:opacity-70 transition-opacity"
                  >
                    <Ghost className="w-4 h-4 text-white shrink-0" />
                    <p className="text-sm font-medium text-white leading-tight">Ghost Players</p>
                  </button>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={ghostCount > 0}
                    onClick={() => setGhostCount(ghostCount > 0 ? 0 : 1)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 ${ghostCount > 0 ? "bg-violet-500" : "bg-white/20"}`}
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
                      <div className="space-y-4 pt-4 mt-4 border-t border-white/10">
                        {/* Number of ghosts — segmented pills */}
                        <div className="px-1">
                          <p className="text-xs font-medium text-gray-400 mb-2">Number of ghosts</p>
                          <div className="flex gap-2">
                            {[1, 2, 3, 4].map((n) => (
                              <button
                                key={n}
                                onClick={() => setGhostCount(n)}
                                className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all duration-150 ${
                                  ghostCount === n
                                    ? "bg-violet-500 text-white shadow-md shadow-violet-500/30 scale-105"
                                    : "bg-white/10 text-gray-400 hover:bg-white/20"
                                }`}
                              >
                                {n}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Rolls per round — stepper */}
                        <div className="px-1">
                          <p className="text-xs font-medium text-gray-400 mb-2">Rolls per round</p>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => setGhostRollsPerRound(ghostRollsPerRound === null ? 10 : Math.max(1, ghostRollsPerRound - 1))}
                              disabled={ghostRollsPerRound !== null && ghostRollsPerRound <= 1}
                              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-gray-300 hover:bg-violet-100 hover:text-violet-600 transition-all disabled:opacity-30 disabled:pointer-events-none text-xl font-bold leading-none"
                            >
                              −
                            </button>
                            <div className="flex-1 text-center">
                              <span className="text-xl font-bold text-white tabular-nums">
                                {ghostRollsPerRound === null ? "All" : ghostRollsPerRound}
                              </span>
                            </div>
                            <button
                              onClick={() => setGhostRollsPerRound(ghostRollsPerRound === null ? null : ghostRollsPerRound >= 10 ? null : ghostRollsPerRound + 1)}
                              disabled={ghostRollsPerRound === null}
                              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-gray-300 hover:bg-violet-100 hover:text-violet-600 transition-all disabled:opacity-30 disabled:pointer-events-none text-xl font-bold leading-none"
                            >
                              +
                            </button>
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
        <label className="block text-sm font-bold text-gray-300 mb-3 text-center uppercase tracking-wider">
          Turn Order ({players.length})
          {players.length > 1 && (
            <span className="text-gray-500 font-normal normal-case text-xs ml-2">tap arrows to reorder</span>
          )}
        </label>

        <div className="space-y-2 mb-3 overflow-visible">
          <AnimatePresence initial={false}>
            {players.map((p, idx) => (
              <motion.div
                key={p.id}
                layout
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
                className={`flex items-center gap-3 rounded-2xl px-3 py-4 border transition-all ${colorPickerId === p.id ? "relative z-50" : ""}`}
                style={{ backgroundColor: p.color + "55", borderColor: p.color + "cc" }}
              >
                {/* Left: arrows + color swatch */}
                <div className="flex items-center gap-2 shrink-0 w-14">
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => idx > 0 && reorderPlayers(idx, idx - 1)}
                      disabled={idx === 0}
                      className="text-white/40 hover:text-white disabled:opacity-20 disabled:pointer-events-none cursor-pointer p-0.5"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => idx < players.length - 1 && reorderPlayers(idx, idx + 1)}
                      disabled={idx === players.length - 1}
                      className="text-white/40 hover:text-white disabled:opacity-20 disabled:pointer-events-none cursor-pointer p-0.5"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Color swatch */}
                  <div className="relative flex items-center">
                    <button
                      onClick={() => setColorPickerId(colorPickerId === p.id ? null : p.id)}
                      className="w-5 h-5 rounded-full border-2 border-white/30 hover:border-white/70 transition-all"
                      style={{ backgroundColor: p.color }}
                      title="Change color"
                    />
                    {colorPickerId === p.id && (
                      <div
                        ref={colorPickerRef}
                        className="absolute left-0 bottom-full mb-2 z-50 bg-gray-900 border border-white/10 rounded-2xl p-3 shadow-2xl"
                        style={{ width: 160 }}
                      >
                        <div className="grid grid-cols-4 gap-2">
                          {COLOR_PALETTE.map((c) => (
                            <button
                              key={c}
                              onClick={() => { recolorPlayer(p.id, c); setColorPickerId(null); }}
                              className={`w-8 h-8 rounded-full transition-transform hover:scale-110 active:scale-95 ${p.color === c ? "ring-2 ring-white ring-offset-2 ring-offset-gray-900" : ""}`}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Center: name / ghost icon — truly centered */}
                <div className="flex-1 flex items-center justify-center">
                  {p.isGhost ? (
                    <Ghost className="w-9 h-9 text-white/90" />
                  ) : editingId === p.id ? (
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
                      className="w-full bg-black/30 border border-white/30 rounded-lg px-3 py-1 text-3xl font-bold text-white text-center focus:outline-none focus:border-white/60"
                      maxLength={20}
                    />
                  ) : (
                    <span
                      className="text-3xl font-bold text-white tracking-tight cursor-default"
                      onDoubleClick={() => { setEditingId(p.id); setEditName(p.name); }}
                    >
                      {p.name}
                    </span>
                  )}
                </div>

                {/* Right: delete (or spacer to keep name centered) */}
                <div className="shrink-0 w-14 flex items-center justify-end">
                  {!p.isGhost && (
                    <button
                      onClick={() => removePlayer(p.id)}
                      className="text-white/30 hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
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
            className="flex-1 bg-gray-900/80 shadow-sm border border-gray-700 rounded-xl px-4 py-3.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium"
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
          className="w-full relative overflow-hidden group bg-emerald-500 hover:bg-emerald-400 text-white/90 text-xl font-black py-7 rounded-2xl transition-all duration-300 shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)] hover:shadow-[0_0_60px_-15px_rgba(16,185,129,0.7)] hover:-translate-y-1 disabled:bg-gray-800 disabled:text-gray-500 disabled:shadow-none disabled:translate-y-0 disabled:cursor-not-allowed"
        >
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-emerald-400 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <span className="relative flex items-center justify-center">
            <Play className="w-6 h-6 mr-2 fill-current" />
            Start Game
          </span>
        </Button>
        {players.length < 2 && (
          <p className="text-gray-500 text-sm font-medium text-center mt-3">Add at least 2 players</p>
        )}
      </motion.div>

      {/* Round Events info dialog */}
      <Dialog open={eventModalOpen} onOpenChange={setEventModalOpen}>
        <DialogTitle className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-white" />
          Round Events
        </DialogTitle>
        <div className="max-h-[65vh] overflow-y-auto space-y-4 -mx-1 px-1">
          <p className="text-sm text-gray-400 mb-6">
            If enabled, one random event will trigger at the start of each round, modifying the rules for everyone.
          </p>
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <h3 className="font-bold text-red-400 mb-1 flex items-center gap-2"><Flame className="w-4 h-4 text-red-500" /> Devil&apos;s Mercy</h3>
            <p className="text-sm text-gray-300">The first 7 in the danger zone won&apos;t bust — it just adds 7 and play continues.</p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
            <h3 className="font-bold text-emerald-400 mb-1 flex items-center gap-2"><Shield className="w-4 h-4 text-emerald-500" /> Extended Safety</h3>
            <p className="text-sm text-gray-300">Safe zone runs for 5 rolls this round instead of 3.</p>
          </div>
          <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4">
            <h3 className="font-bold text-violet-400 mb-1 flex items-center gap-2"><Ghost className="w-4 h-4 text-violet-500" /> Ghost Overdrive</h3>
            <p className="text-sm text-gray-300">Every ghost rolls twice per turn this round.</p>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
            <h3 className="font-bold text-yellow-500 mb-1 flex items-center gap-2"><Star className="w-4 h-4 text-yellow-500" /> Golden Totals</h3>
            <p className="text-sm text-gray-300">Any roll totaling 10, 11, or 12 counts as doubles.</p>
          </div>
          <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-4">
            <h3 className="font-bold text-sky-400 mb-1 flex items-center gap-2"><Cloud className="w-4 h-4 text-sky-500" /> Heavenly Sevens</h3>
            <p className="text-sm text-gray-300">7s in the safe zone are worth +140 instead of +70.</p>
          </div>
          <div className="bg-teal-500/10 border border-teal-500/20 rounded-xl p-4">
            <h3 className="font-bold text-teal-400 mb-1 flex items-center gap-2"><Shield className="w-4 h-4 text-teal-500" /> Brazilian Bank</h3>
            <p className="text-sm text-gray-300">The first danger-zone 7 halves the bank instead of busting it.</p>
          </div>
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
            <h3 className="font-bold text-orange-400 mb-1 flex items-center gap-2"><Timer className="w-4 h-4 text-orange-500" /> Short Fuse</h3>
            <p className="text-sm text-gray-300">Safe zone is only 1 roll this round. Danger comes fast.</p>
          </div>
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4">
            <h3 className="font-bold text-rose-400 mb-1 flex items-center gap-2"><Bomb className="w-4 h-4 text-rose-500" /> Time Bomb</h3>
            <p className="text-sm text-gray-300">7 won&apos;t bust this round — but one number between 2 and 12 is secretly rigged to. Roll it in the danger zone and it&apos;s over.</p>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
            <h3 className="font-bold text-amber-400 mb-1 flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500" /> Triple Threat</h3>
            <p className="text-sm text-gray-300">Hit doubles and the bank triples instead of doubling.</p>
          </div>
        </div>
      </Dialog>

      {/* Ghost Players info dialog */}
      <Dialog open={ghostModalOpen} onOpenChange={setGhostModalOpen}>
        <DialogTitle className="flex items-center gap-2 mb-4">
          <Ghost className="w-5 h-5 text-white" />
          Ghost Players
        </DialogTitle>
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            Players that roll automatically — always 7s in the safe zone and doubles in the danger zone. Good for filling out a group or keeping the bank from sitting still.
          </p>
        </div>
      </Dialog>
    </div>
  );
}
