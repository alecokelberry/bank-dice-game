"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store/game-store";
import { ScrollText } from "lucide-react";

export function GameLog() {
  const gameLog = useGameStore((s) => s.gameLog);

  if (gameLog.length === 0) return null;

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 text-sm text-gray-400 uppercase tracking-wider mb-2 px-1">
        <ScrollText className="w-3.5 h-3.5" />
        <span>Log</span>
      </div>
      <div className="max-h-32 overflow-y-auto space-y-1 bg-white/5 rounded-xl p-3 border border-white/10">
        <AnimatePresence initial={false}>
          {gameLog.slice(0, 15).map((msg, idx) => (
            <motion.div
              key={`${msg}-${idx}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`text-xs font-mono ${
                idx === 0 ? "text-gray-200" : "text-gray-500"
              }`}
            >
              {msg}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
