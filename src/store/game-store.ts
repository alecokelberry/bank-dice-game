import { create } from "zustand";
import { persist } from "zustand/middleware";

// --- Types ---

export interface Player {
  id: string;
  name: string;
  score: number;
  color: string;
  consecutiveBanks: number;
  isGhost?: boolean;
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
  devilsMercyUsed: boolean;
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
  ghostsActiveUntilRound: number;
  roundEventsEnabled: boolean;
  superpowersEnabled: boolean;
  activeRoundEvent: string | null;

  // Undo support
  undoSnapshot: StateSnapshot | null;
  undoLabel: string | null;
  gameLog: string[];

  // Event states
  devilsMercyUsed: boolean;

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
  setGhostCount: (count: number) => void;
  setGhostsActiveUntilRound: (rounds: number) => void;
  setRoundEventsEnabled: (enabled: boolean) => void;
  setSuperpowersEnabled: (enabled: boolean) => void;
  setActiveRoundEvent: (event: string | null) => void;

  // Gameplay actions
  handleRoll: (die1: number, die2: number, forceNotDouble?: boolean) => void;
  handleBank: (playerId: string) => void;
  advanceRound: () => void;
  dismissRoundSummary: () => void;
  undo: () => void;
  autoRollGhost: () => void;

  // Derived helpers
  getActivePlayers: () => Player[];
  getWinners: () => Player[];
}

// --- Helpers ---

/** Generates a short random ID for player identification. */
function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/** All available round events, keyed by id. */
export const ROUND_EVENTS: Array<{ id: string; name: string; description: string }> = [
  { id: "triple_threat", name: "Triple Threat", description: "Doubles multiply the bank by 3× instead of 2× this round." },
  { id: "extended_safety", name: "Extended Safety", description: "The safe zone lasts for 5 rolls instead of 3. Push your luck!" },
  { id: "ghost_overdrive", name: "Ghost Overdrive", description: "Every ghost rolls twice this round (two separate turns). They become absolute monsters." },
  { id: "heavenly_sevens", name: "Heavenly Sevens", description: "Safe-zone 7s give +140 to the bank instead of +70." },
];

/** Picks a random round event when round events are enabled. */
function pickRandomEvent(): typeof ROUND_EVENTS[0] {
  return ROUND_EVENTS[Math.floor(Math.random() * ROUND_EVENTS.length)];
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
 * Returns the effective rotation of players for the round. 
 * If Ghost Overdrive is active, ghosts get appended to the end of the rotation a second time.
 */
export function getTurnOrder(players: Player[], activeRoundEvent: string | null, currentRound: number, ghostsActiveUntilRound: number): Player[] {
  if (activeRoundEvent !== "ghost_overdrive") return players;
  const activeGhosts = players.filter(p => p.isGhost && currentRound <= ghostsActiveUntilRound);
  return [...players, ...activeGhosts];
}

/**
 * Advances the roller index to the next unbanked player.
 * Wraps around the player array, skipping anyone who has already banked
 * or ghosts that are inactive this round.
 */
function advanceRollerIndex(
  current: number,
  turnOrder: Player[],
  bankedThisRound: string[],
  currentRound: number,
  ghostsActiveUntilRound: number
): number {
  if (turnOrder.length === 0) return 0;
  let next = (current + 1) % turnOrder.length;
  for (let i = 0; i < turnOrder.length; i++) {
    const p = turnOrder[next];
    const isGhostInactive = p.isGhost && currentRound > ghostsActiveUntilRound;
    if (!bankedThisRound.includes(p.id) && !isGhostInactive) return next;
    next = (next + 1) % turnOrder.length;
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
    devilsMercyUsed: state.devilsMercyUsed,
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
      ghostsActiveUntilRound: 10,
      roundEventsEnabled: false,
      superpowersEnabled: false,
      activeRoundEvent: null,

      undoSnapshot: null,
      undoLabel: null,
      gameLog: [],
      
      devilsMercyUsed: false,

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
      setGhostsActiveUntilRound: (rounds: number) => set({ ghostsActiveUntilRound: rounds }),
      setRoundEventsEnabled: (enabled: boolean) => set({ roundEventsEnabled: enabled }),
      setSuperpowersEnabled: (enabled: boolean) => set({ superpowersEnabled: enabled }),
      setActiveRoundEvent: (event: string | null) => set({ activeRoundEvent: event }),


      setGhostCount: (count: number) => {
        set((state) => {
          if (state.phase !== "setup") return state;
          const currentGhosts = state.players.filter((p) => p.isGhost);
          const humans = state.players.filter((p) => !p.isGhost);
          let newPlayers = [...state.players];
          
          if (count > currentGhosts.length) {
            for (let i = currentGhosts.length; i < count; i++) {
              newPlayers.push({
                ...makeDefaultPlayer(`Ghost ${i + 1}`, newPlayers.length),
                isGhost: true,
                color: "#8b5cf6", // distinct purple color for ghosts
              });
            }
          } else if (count < currentGhosts.length) {
            let toRemove = currentGhosts.length - count;
            for (let i = newPlayers.length - 1; i >= 0 && toRemove > 0; i--) {
              if (newPlayers[i].isGhost) {
                newPlayers.splice(i, 1);
                toRemove--;
              }
            }
          }
          return { players: newPlayers };
        });
      },

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
          activeRoundEvent: state.roundEventsEnabled ? pickRandomEvent().id : null,
          undoSnapshot: null,
          undoLabel: null,
          gameLog: [],
          roundSummary: null,
          roundSummaryRound: 0,
          players: resetPlayers,
          currentRollerIndex: Math.max(
            0,
            resetPlayers.findIndex(p => !p.isGhost || state.currentRound <= state.ghostsActiveUntilRound)
          ),
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
          devilsMercyUsed: false,
          roundSummary: null,
          roundSummaryRound: 0,
          players: state.players.map((p) => ({ ...p, score: 0, consecutiveBanks: 0 })),
        });
      },

      // --- Gameplay Actions ---

      handleRoll: (die1: number, die2: number, forceNotDouble = false) => {
        const state = get();
        if (state.phase !== "playing" || state.isBust) return;

        const snapshot = takeSnapshot(state);
        const sum = die1 + die2;
        const isDouble = !forceNotDouble && die1 === die2;
        const rc = state.rollCount;
        const safeZoneLimit = getSafeZoneRolls(state);
        let bankAfter = state.bank;
        let wasBust = false;

        if (rc < safeZoneLimit) {
          // Safe zone: all rolls add to the bank, 7s are usually worth +70
          const luckySevenBonus = state.activeRoundEvent === "heavenly_sevens" ? 140 : 70;
          bankAfter = state.bank + (sum === 7 ? luckySevenBonus : sum);
        } else {
          // Danger zone: doubles multiply, 7s bust, everything else adds
          const multiplier = (isDouble && state.activeRoundEvent === "triple_threat") ? 3 : 2;
          if (isDouble) {
            bankAfter = state.bank * multiplier;
          } else if (sum === 7) {
            if (state.activeRoundEvent === "devils_mercy" && !state.devilsMercyUsed) {
              bankAfter = state.bank + 7;
            } else {
              bankAfter = 0;
              wasBust = true;
            }
          } else {
            bankAfter = state.bank + sum;
          }
        }

        // Build a human-readable log entry
        let logMsg = `Roll #${rc + 1}: ${die1}+${die2}=${sum}`;
        if (wasBust) {
          logMsg += " → BUST!";
        } else if (sum === 7 && rc >= safeZoneLimit && state.activeRoundEvent === "devils_mercy") {
          logMsg += ` → DEVIL'S MERCY! +7 (Bank: ${bankAfter})`;
        } else if (isDouble && rc >= safeZoneLimit) {
          const mult = state.activeRoundEvent === "triple_threat" ? 3 : 2;
          logMsg += ` → DOUBLES! Bank ${mult === 3 ? "tripled" : "doubled"} to ${bankAfter}`;
        } else if (sum === 7 && rc < safeZoneLimit) {
          const bonusAmt = state.activeRoundEvent === "heavenly_sevens" ? 140 : 70;
          logMsg += ` → Lucky 7! +${bonusAmt} (Bank: ${bankAfter})`;
        } else {
          logMsg += ` → Bank: ${bankAfter}`;
        }

        const turnOrder = getTurnOrder(state.players, state.activeRoundEvent, state.currentRound, state.ghostsActiveUntilRound);
        const nextRollerIndex = advanceRollerIndex(
          state.currentRollerIndex,
          turnOrder,
          state.bankedThisRound,
          state.currentRound,
          state.ghostsActiveUntilRound
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
          devilsMercyUsed: state.devilsMercyUsed || (sum === 7 && rc >= safeZoneLimit && state.activeRoundEvent === "devils_mercy"),
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

        const calculateBankAmount = (p: Player) => {
          let amt = state.bank;
          if (p.consecutiveBanks >= 5) amt += 50;
          else if (p.consecutiveBanks >= 3) amt += 25;
          return amt;
        };

        const amount = calculateBankAmount(player);

        let updatedPlayers = state.players.map((p) =>
          p.id === playerId
            ? { ...p, score: p.score + amount, consecutiveBanks: p.consecutiveBanks + 1 }
            : p
        );

        let newBanked = [...state.bankedThisRound, playerId];
        const streakBonus = player.consecutiveBanks >= 5 ? 50 : player.consecutiveBanks >= 3 ? 25 : 0;
        let logMsg = `${player.name} BANKED ${amount} pts! (Total: ${updatedPlayers.find(p => p.id === playerId)!.score})`;
        if (streakBonus > 0) logMsg += ` [+${streakBonus} streak bonus!]`;

        // Check if every human player has banked
        const allHumansBanked = updatedPlayers
          .filter((p) => !p.isGhost)
          .every((p) => newBanked.includes(p.id));

        if (allHumansBanked) {
          // Force ghosts to bank too
          const activeGhosts = updatedPlayers.filter((p) => p.isGhost && state.currentRound <= state.ghostsActiveUntilRound);
          updatedPlayers = updatedPlayers.map((p) => {
            if (activeGhosts.some((g) => g.id === p.id)) {
               const ghostAmount = calculateBankAmount(p);
               return { ...p, score: p.score + ghostAmount, consecutiveBanks: p.consecutiveBanks + 1 };
            }
            return p;
          });
          newBanked = [...newBanked, ...activeGhosts.map((g) => g.id)];

          const summary: RoundSummaryEntry[] = updatedPlayers.map((p) => {
            const isBanked = newBanked.includes(p.id);
            return {
              playerId: p.id,
              playerName: p.name,
              banked: isBanked,
              amount: isBanked ? calculateBankAmount(state.players.find(x => x.id === p.id)!) : 0,
            };
          });

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
          const turnOrder = getTurnOrder(updatedPlayers, state.activeRoundEvent, state.currentRound, state.ghostsActiveUntilRound);
          const nextRollerIndex = advanceRollerIndex(
            state.currentRollerIndex,
            turnOrder,
            newBanked,
            state.currentRound,
            state.ghostsActiveUntilRound
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
          const wasActiveGhost = p.isGhost && state.currentRound <= state.ghostsActiveUntilRound;
          return {
            playerId: p.id,
            playerName: p.name,
            banked: !!(didBank || wasActiveGhost), // For ghosts, mark as "banked" if they were active
            amount: didBank ? state.bank : 0, // But they get 0
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
          devilsMercyUsed: false,
          currentRound: isGameOver ? state.currentRound : nextRound,
          phase: isGameOver ? "finished" : "round_summary",
          roundSummary: summary,
          roundSummaryRound: state.currentRound,
          gameLog: [
            isGameOver ? "Game Over!" : `── Round ${nextRound} ──`,
            ...state.gameLog,
          ].slice(0, 50),
          activeRoundEvent: state.roundEventsEnabled && !isGameOver ? pickRandomEvent().id : null,
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
          devilsMercyUsed: snapshot.devilsMercyUsed,
          undoSnapshot: null,
          undoLabel: null,
          roundSummary: null,
        });
      },

      autoRollGhost: () => {
        const state = get();
        if (state.phase !== "playing" || state.isBust) return;

        const turnOrder = getTurnOrder(state.players, state.activeRoundEvent, state.currentRound, state.ghostsActiveUntilRound);
        const roller = turnOrder[state.currentRollerIndex % turnOrder.length];
        if (!roller?.isGhost || state.currentRound > state.ghostsActiveUntilRound) return;

        let d1: number, d2: number;
        if (state.rollCount < getSafeZoneRolls(state)) {
          // Force 7
          d1 = Math.floor(Math.random() * 6) + 1;
          d2 = 7 - d1;
        } else {
          // Force doubles (2-6)
          d1 = Math.floor(Math.random() * 5) + 2;
          d2 = d1;
        }

        get().handleRoll(d1, d2, false);
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
        ghostsActiveUntilRound: state.ghostsActiveUntilRound,
      }),
    }
  )
);

// --- Selectors ---

export const getSafeZoneRolls = (state: GameState) => 
  state.activeRoundEvent === "extended_safety" ? 5 : 3;

export const selectIsInDangerZone = (state: GameState) =>
  state.rollCount >= getSafeZoneRolls(state);

export const selectCanRoll = (state: GameState) =>
  state.phase === "playing" && !state.isBust;

export const selectCanBank = (state: GameState) =>
  state.phase === "playing" && !state.isBust && state.rollCount > 0;

export function selectCurrentRoller(state: GameState): Player | null {
  if (state.phase !== "playing" || state.players.length === 0) return null;
  const turnOrder = getTurnOrder(state.players, state.activeRoundEvent, state.currentRound, state.ghostsActiveUntilRound);
  return turnOrder[state.currentRollerIndex % turnOrder.length] ?? null;
}
