"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface DieProps {
  value: number | null;
  isRolling?: boolean;
  size?: number;
}

function DotPattern({ value }: { value: number }) {
  const positions: Record<number, [number, number][]> = {
    1: [[30, 30]],
    2: [[15, 15], [45, 45]],
    3: [[15, 15], [30, 30], [45, 45]],
    4: [[15, 15], [45, 15], [15, 45], [45, 45]],
    5: [[15, 15], [45, 15], [30, 30], [15, 45], [45, 45]],
    6: [[15, 15], [45, 15], [15, 30], [45, 30], [15, 45], [45, 45]],
  };

  const dots = positions[value] || [];

  return (
    <>
      {dots.map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r="5"
          fill={value === 1 ? "#dc2626" : "currentColor"}
        />
      ))}
    </>
  );
}

export function Die({ value, isRolling, size = 80 }: DieProps) {
  const [tumbleValue, setTumbleValue] = useState(value);

  useEffect(() => {
    if (!isRolling) {
      setTumbleValue(value);
      return;
    }
    let frame = 0;
    const interval = setInterval(() => {
      setTumbleValue(((frame % 6) + 1) as number);
      frame++;
    }, 60);
    return () => clearInterval(interval);
  }, [isRolling, value]);

  const displayValue = isRolling ? tumbleValue : value;

  return (
    <motion.div
      className="relative select-none"
      style={{ width: size, height: size, perspective: 300 }}
      animate={
        isRolling
          ? {
              rotateX: [0, 360, 720],
              rotateY: [0, -180, -360],
              scale: [1, 1.15, 1],
            }
          : { rotateX: 0, rotateY: 0, scale: 1 }
      }
      transition={
        isRolling
          ? { duration: 0.5, ease: "easeOut" }
          : { type: "spring", stiffness: 400, damping: 15, mass: 0.8 }
      }
    >
      <div
        className="w-full h-full rounded-2xl flex items-center justify-center text-gray-800"
        style={{
          background: "linear-gradient(145deg, #ffffff 0%, #e8e8e8 100%)",
          boxShadow: isRolling
            ? "0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.8)"
            : "0 6px 16px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.8), inset 0 -1px 0 rgba(0,0,0,0.05)",
          border: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        <svg viewBox="0 0 60 60" className="w-3/4 h-3/4">
          {displayValue ? (
            <DotPattern value={displayValue} />
          ) : (
            <text x="30" y="35" textAnchor="middle" fontSize="20" fill="currentColor" opacity="0.3">?</text>
          )}
        </svg>
      </div>
    </motion.div>
  );
}

interface DicePairProps {
  die1: number | null;
  die2: number | null;
  isRolling?: boolean;
  onRoll?: () => void;
}

export function DicePair({ die1, die2, isRolling, onRoll }: DicePairProps) {
  return (
    <motion.div
      className={`flex gap-5 items-center justify-center ${onRoll ? "cursor-pointer" : ""}`}
      onClick={onRoll}
      whileTap={onRoll ? { scale: 0.95 } : undefined}
    >
      <Die value={die1} isRolling={isRolling} size={85} />
      <Die value={die2} isRolling={isRolling} size={85} />
    </motion.div>
  );
}
