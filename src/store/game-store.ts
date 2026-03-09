import { create } from "zustand";
import { persist } from "zustand/middleware";

// --- Types ---

export interface Player {
  id: string;
  name: string;
  score: number;
  color: string;
  consecutiveBanks: number;
}

export type GamePhase = "setup" | "playing" | "round_summary" | "finished";

/** Snapshot of the game state used for single-step undo. */
export interface StateSnapshot {
  players: Player[];
  currentRound: number;
  bank: number;
  rollCount: number;
  bankedThisRound: string[];
  isBust: boolean;
  phase: GamePhase;
  lastDie1: number | null;
  lastDie2: number | null;
  currentRollerIndex: number;
  gameLog: string[];
}

/** Entry shown in the between-round summary overlay. */
export interface RoundSummaryEntry {
  playerId: string;
  playerName: string;
  banked: boolean;
  amount: number;
}

// --- Constants ---

/** Palette assigned to players in order of creation. */
const PLAYER_COLORS = [
  "#6366f1", "#f59e0b", "#10b981", "#ef4444",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316",
];

/** Number of rolls before the danger zone begins. */
const SAFE_ZONE_ROLLS = 3;

// --- Store Interface ---

export interface GameState {
  // Core game data
  players: Player[];
  currentRound: number;
  totalRounds: number;
  bank: number;
  rollCount: number;
  bankedThisRound: string[];
  isBust: boolean;
  phase: GamePhase;
  lastDie1: number | null;
  lastDie2: number | null;
  currentRollerIndex: number;

  // Undo support
  undoSnapshot: StateSnapshot | null;
  undoLabel: string | null;
  gameLog: string[];

  // Round summary
  roundSummary: RoundSummaryEntry[] | null;
  roundSummaryRound: number;

  // Setup actions
  addPlayer: (name: string) => void;
  removePlayer: (id: string) => void;
  reorderPlayers: (fromIndex: number, toIndex: number) => void;
  setTotalRounds: (rounds: number) => void;
  renamePlayer: (id: string, name: string) => void;
  startGame: () => void;
  resetGame: () => void;

  // Gameplay actions
  handleRoll: (die1: number, die2: number) => void;
  handleBank: (playerId: string) => void;
  advanceRound: () => void;
  dismissRoundSummary: () => void;
  undo: () => void;

  // Derived helpers
  getActivePlayers: () => Player[];
  getWinners: () => Player[];
}

// --- Helpers ---

/** Generates a short random ID for player identification. */
function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/** Creates a new player with default values. */
function makeDefaultPlayer(name: string, colorIndex: number): Player {
  return {
    id: generateId(),
    name: name.trim(),
    score: 0,
    color: PLAYER_COLORS[colorIndex % PLAYER_COLORS.length],
    consecutiveBanks: 0,
  };
}

/**
 * Advances the roller index to the next unbanked player.
 * Wraps around the player array, skipping anyone who has already banked.
 */
function advanceRollerIndex(
  current: number,
  players: Player[],
  bankedThisRound: string[]
): number {
  if (players.length === 0) return 0;
  let next = (current + 1) % players.length;
  for (let i = 0; i < players.length; i++) {
    if (!bankedThisRound.includes(players[next].id)) return next;
    next = (next + 1) % players.length;
  }
  return next;
}

/** Captures a full snapshot of the current game state for undo. */
function takeSnapshot(state: GameState): StateSnapshot {
  return {
    players: state.players.map((p) => ({ ...p })),
    currentRound: state.currentRound,
    bank: state.bank,
    rollCount: state.rollCount,
    bankedThisRound: [...state.bankedThisRound],
    isBust: state.isBust,
    phase: state.phase,
    lastDie1: state.lastDie1,
    lastDie2: state.lastDie2,
    currentRollerIndex: state.currentRollerIndex,
    gameLog: [...state.gameLog],
  };
}

// --- Zustand Store ---

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      players: [],
      currentRound: 1,
      totalRounds: 10,
      bank: 0,
      rollCount: 0,
      bankedThisRound: [],
      isBust: false,
      phase: "setup",
      lastDie1: null,
      lastDie2: null,
      currentRollerIndex: 0,
      undoSnapshot: null,
      undoLabel: null,
      gameLog: [],
      roundSummary: null,
      roundSummaryRound: 0,

      // --- Setup Actions ---

      addPlayer: (name: string) => {
        set((state) => ({
          players: [...state.players, makeDefaultPlayer(name, state.players.length)],
        }));
      },

      removePlayer: (id: string) => {
        set((state) => ({ players: state.players.filter((p) => p.id !== id) }));
      },

      reorderPlayers: (fromIndex: number, toIndex: number) => {
        set((state) => {
          const players = [...state.players];
          const [moved] = players.splice(fromIndex, 1);
          players.splice(toIndex, 0, moved);
          return { players };
        });
      },

      setTotalRounds: (rounds: number) => set({ totalRounds: rounds }),

      renamePlayer: (id: string, name: string) => {
        set((state) => ({
          players: state.players.map((p) =>
            p.id === id ? { ...p, name: name.trim() } : p
          ),
        }));
      },

      startGame: () => {
        const state = get();
        if (state.players.length < 2) return;

        const resetPlayers = state.players.map((p) => ({
          ...p,
          score: 0,
          consecutiveBanks: 0,
        }));

        set({
          phase: "playing",
          currentRound: 1,
          bank: 0,
          rollCount: 0,
          bankedThisRound: [],
          isBust: false,
          lastDie1: null,
          lastDie2: null,
          currentRollerIndex: 0,
          undoSnapshot: null,
          undoLabel: null,
          gameLog: [],
          roundSummary: null,
          roundSummaryRound: 0,
          players: resetPlayers,
        });
      },

      resetGame: () => {
        const state = get();
        set({
          phase: "setup",
          currentRound: 1,
          bank: 0,
          rollCount: 0,
          bankedThisRound: [],
          isBust: false,
          lastDie1: null,
          lastDie2: null,
          undoSnapshot: null,
          undoLabel: null,
          gameLog: [],
          roundSummary: null,
          roundSummaryRound: 0,
          players: state.players.map((p) => ({ ...p, score: 0, consecutiveBanks: 0 })),
        });
      },

      // --- Gameplay Actions ---

      handleRoll: (die1: number, die2: number) => {
        const state = get();
        if (state.phase !== "playing" || state.isBust) return;

        const snapshot = takeSnapshot(state);
        const sum = die1 + die2;
        const isDouble = die1 === die2;
        const rc = state.rollCount;
        let bankAfter = state.bank;
        let wasBust = false;

        if (rc < SAFE_ZONE_ROLLS) {
          // Safe zone: all rolls add to the bank, 7s are worth +70
          bankAfter = state.bank + (sum === 7 ? 70 : sum);
        } else {
          // Danger zone: doubles multiply, 7s bust, everything else adds
          if (isDouble) {
            bankAfter = state.bank * 2;
          } else if (sum === 7) {
            bankAfter = 0;
            wasBust = true;
          } else {
            bankAfter = state.bank + sum;
          }
        }

        // Build a human-readable log entry
        let logMsg = `Roll #${rc + 1}: ${die1}+${die2}=${sum}`;
        if (wasBust) {
          logMsg += " → BUST!";
        } else if (isDouble && rc >= SAFE_ZONE_ROLLS) {
          logMsg += ` → DOUBLES! Bank doubled to ${bankAfter}`;
        } else if (sum === 7 && rc < SAFE_ZONE_ROLLS) {
          logMsg += ` → Lucky 7! +70 (Bank: ${bankAfter})`;
        } else {
          logMsg += ` → Bank: ${bankAfter}`;
        }

        const nextRollerIndex = advanceRollerIndex(
          state.currentRollerIndex,
          state.players,
          state.bankedThisRound
        );

        set({
          bank: bankAfter,
          rollCount: rc + 1,
          isBust: wasBust,
          lastDie1: die1,
          lastDie2: die2,
          currentRollerIndex: nextRollerIndex,
          undoSnapshot: snapshot,
          undoLabel: `Roll #${rc + 1}: ${die1}+${die2}`,
          gameLog: [logMsg, ...state.gameLog].slice(0, 50),
        });
      },

      handleBank: (playerId: string) => {
        const state = get();
        if (state.phase !== "playing") return;
        if (state.bankedThisRound.includes(playerId)) return;
        if (state.isBust || state.rollCount === 0) return;

        const player = state.players.find((p) => p.id === playerId);
        if (!player) return;

        const snapshot = takeSnapshot(state);
        let amount = state.bank;

        // Streak bonus: +25 for 3+ consecutive banks, +50 for 5+
        const streakCount = player.consecutiveBanks;
        if (streakCount >= 5) amount += 50;
        else if (streakCount >= 3) amount += 25;

        const updatedPlayers = state.players.map((p) =>
          p.id === playerId
            ? { ...p, score: p.score + amount, consecutiveBanks: p.consecutiveBanks + 1 }
            : p
        );

        const newBanked = [...state.bankedThisRound, playerId];
        const streakBonus = streakCount >= 5 ? 50 : streakCount >= 3 ? 25 : 0;
        let logMsg = `${player.name} BANKED ${amount} pts! (Total: ${player.score + amount})`;
        if (streakBonus > 0) logMsg += ` [+${streakBonus} streak bonus!]`;

        // Check if every player has now banked, ending the round
        const allBanked = updatedPlayers.every((p) => newBanked.includes(p.id));

        if (allBanked) {
          const summary: RoundSummaryEntry[] = updatedPlayers.map((p) => ({
            playerId: p.id,
            playerName: p.name,
            banked: true,
            amount,
          }));

          const nextRound = state.currentRound + 1;
          const isGameOver = nextRound > state.totalRounds;

          set({
            players: updatedPlayers,
            bankedThisRound: [],
            bank: 0,
            rollCount: 0,
            isBust: false,
            currentRound: isGameOver ? state.currentRound : nextRound,
            phase: isGameOver ? "finished" : "round_summary",
            lastDie1: null,
            lastDie2: null,
            currentRollerIndex: 0,
            undoSnapshot: snapshot,
            undoLabel: `${player.name} banked ${amount}`,
            roundSummary: summary,
            roundSummaryRound: state.currentRound,
            gameLog: [
              isGameOver ? "Game Over!" : `── Round ${nextRound} ──`,
              logMsg,
              ...state.gameLog,
            ].slice(0, 50),
          });
        } else {
          const nextRollerIndex = advanceRollerIndex(
            state.currentRollerIndex,
            updatedPlayers,
            newBanked
          );
          set({
            players: updatedPlayers,
            bankedThisRound: newBanked,
            currentRollerIndex: nextRollerIndex,
            undoSnapshot: snapshot,
            undoLabel: `${player.name} banked ${amount}`,
            gameLog: [logMsg, ...state.gameLog].slice(0, 50),
          });
        }
      },

      advanceRound: () => {
        const state = get();
        const nextRound = state.currentRound + 1;
        const isGameOver = nextRound > state.totalRounds;

        // Build the round summary for the bust screen
        const summary: RoundSummaryEntry[] = state.players.map((p) => {
          const didBank = state.bankedThisRound.includes(p.id);
          return {
            playerId: p.id,
            playerName: p.name,
            banked: didBank,
            amount: didBank ? state.bank : 0,
          };
        });

        // Reset banking streaks for players who didn't bank this round
        const updatedPlayers = state.players.map((p) => ({
          ...p,
          consecutiveBanks: state.bankedThisRound.includes(p.id) ? p.consecutiveBanks : 0,
        }));

        set({
          players: updatedPlayers,
          bank: 0,
          rollCount: 0,
          bankedThisRound: [],
          isBust: false,
          lastDie1: null,
          lastDie2: null,
          currentRollerIndex: 0,
          undoSnapshot: null,
          undoLabel: null,
          currentRound: isGameOver ? state.currentRound : nextRound,
          phase: isGameOver ? "finished" : "round_summary",
          roundSummary: summary,
          roundSummaryRound: state.currentRound,
          gameLog: [
            isGameOver ? "Game Over!" : `── Round ${nextRound} ──`,
            ...state.gameLog,
          ].slice(0, 50),
        });
      },

      dismissRoundSummary: () => {
        set({ phase: "playing", roundSummary: null, undoSnapshot: null, undoLabel: null });
      },

      undo: () => {
        const snapshot = get().undoSnapshot;
        if (!snapshot) return;

        set({
          players: snapshot.players,
          currentRound: snapshot.currentRound,
          bank: snapshot.bank,
          rollCount: snapshot.rollCount,
          bankedThisRound: snapshot.bankedThisRound,
          isBust: snapshot.isBust,
          phase: snapshot.phase,
          lastDie1: snapshot.lastDie1,
          lastDie2: snapshot.lastDie2,
          currentRollerIndex: snapshot.currentRollerIndex,
          gameLog: snapshot.gameLog,
          undoSnapshot: null,
          undoLabel: null,
          roundSummary: null,
        });
      },

      // --- Derived Helpers ---

      getActivePlayers: () => {
        const state = get();
        return state.players.filter((p) => !state.bankedThisRound.includes(p.id));
      },

      getWinners: () => {
        const players = get().players;
        if (players.length === 0) return [];
        const maxScore = Math.max(...players.map((p) => p.score));
        return players.filter((p) => p.score === maxScore);
      },
    }),
    {
      // Bumped from v2 to v3 to invalidate stale localStorage from older versions
      name: "bank-dice-game-v3",
      partialize: (state) => ({
        players: state.players,
        currentRound: state.currentRound,
        totalRounds: state.totalRounds,
        bank: state.bank,
        rollCount: state.rollCount,
        bankedThisRound: state.bankedThisRound,
        isBust: state.isBust,
        phase: state.phase,
        lastDie1: state.lastDie1,
        lastDie2: state.lastDie2,
        currentRollerIndex: state.currentRollerIndex,
        undoSnapshot: state.undoSnapshot,
        undoLabel: state.undoLabel,
        gameLog: state.gameLog,
        roundSummary: state.roundSummary,
        roundSummaryRound: state.roundSummaryRound,
      }),
    }
  )
);

// --- Selectors ---

export const selectIsInDangerZone = (state: GameState) =>
  state.rollCount >= SAFE_ZONE_ROLLS;

export const selectCanRoll = (state: GameState) =>
  state.phase === "playing" && !state.isBust;

export const selectCanBank = (state: GameState) =>
  state.phase === "playing" && !state.isBust && state.rollCount > 0;

export function selectCurrentRoller(state: GameState): Player | null {
  if (state.phase !== "playing" || state.players.length === 0) return null;
  return state.players[state.currentRollerIndex % state.players.length] ?? null;
}
