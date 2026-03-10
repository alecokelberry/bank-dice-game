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
  superpower?: string | null;
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
  resilientBankUsed: boolean;
  timeBombRoll: number | null;
  superpowersUsedThisRound: string[];
  activeHotStreakPlayerId: string | null;
  activeAllInPlayerId: string | null;
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
  resilientBankUsed: boolean;
  timeBombRoll: number | null;
  superpowersUsedThisRound: string[];
  activeHotStreakPlayerId: string | null;
  activeAllInPlayerId: string | null;

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
  rerollWithWhisperer: (playerId: string, newDie1: number, newDie2: number) => void;
  activateHotStreak: (playerId: string) => void;
  deactivateHotStreak: () => void;
  activateAllIn: (playerId: string) => void;
  deactivateAllIn: () => void;
  useMirrorMaster: (playerId: string) => void;
  useDiceDoctor: (playerId: string, newDie1: number, newDie2: number) => void;

  // Derived helpers
  getActivePlayers: () => Player[];
  getWinners: () => Player[];
}

// --- Helpers ---

/** Generates a short random ID for player identification. */
function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/** All available superpowers, keyed by id. */
export const SUPERPOWERS: Array<{ id: string; name: string; description: string }> = [
  { id: "second_chance", name: "Second Chance", description: "If a 7 busts the bank, your power saves the entire bank and the round continues for everyone." },
  { id: "dice_whisperer", name: "Dice Whisperer", description: "After any roll, reroll one or both dice before the result locks in." },
  { id: "hot_streak", name: "Hot Streak", description: "Arm it before a roll. If a 7 comes up in the danger zone, it's silently swapped for a safe result." },
  { id: "mirror_master", name: "Mirror Master", description: "Once this round, copy the exact roll of the previous player instead of rolling fresh." },
  { id: "dice_doctor", name: "Dice Doctor", description: "Once this round, after your roll, nudge one die up or down by 1." },
  { id: "bank_parasite", name: "Bank Parasite", description: "Passive: every time anyone banks this round, you silently gain +100 points." },
  { id: "all_in", name: "All-In", description: "Arm it before your roll. Doubles give 5× the bank. Roll a 7 and lose your entire score. Go big or go home." },
];

/** Assigns a random superpower to each human player. Ghosts get none. */
function assignSuperpowers(players: Player[], enabled: boolean): Player[] {
  if (!enabled || SUPERPOWERS.length === 0) return players.map((p) => ({ ...p, superpower: null }));
  return players.map((p) => ({
    ...p,
    superpower: p.isGhost ? null : SUPERPOWERS[Math.floor(Math.random() * SUPERPOWERS.length)].id,
  }));
}

/** All available round events, keyed by id. */
export const ROUND_EVENTS: Array<{ id: string; name: string; description: string }> = [
  { id: "triple_threat", name: "Triple Threat", description: "Doubles multiply the bank by 3× instead of 2× this round." },
  { id: "extended_safety", name: "Extended Safety", description: "The safe zone lasts for 5 rolls instead of 3. Push your luck!" },
  { id: "ghost_overdrive", name: "Ghost Overdrive", description: "Every ghost rolls twice this round (two separate turns). They become absolute monsters." },
  { id: "heavenly_sevens", name: "Heavenly Sevens", description: "Safe-zone 7s give +140 to the bank instead of +70." },
  { id: "devils_mercy", name: "Devil's Mercy", description: "The first 7 of the danger zone does not bust — it just adds 7 and continues." },
  { id: "short_fuse", name: "Short Fuse", description: "The safe zone only lasts 1 roll this round. Danger hits early!" },
  { id: "golden_totals", name: "Golden Totals", description: "Any roll totaling 10, 11, or 12 counts as doubles this round." },
  { id: "resilient_bank", name: "Resilient Bank", description: "The first 7 in the danger zone only halves the bank instead of busting." },
  { id: "time_bomb", name: "Time Bomb", description: "A hidden roll somewhere between 4 and 10 is rigged to bust. Nobody knows when it drops." },
];

/** Picks a random round event when round events are enabled. Returns the event id and the time bomb roll (if applicable). */
function pickRandomEvent(): { id: string; timeBombRoll: number | null } {
  const event = ROUND_EVENTS[Math.floor(Math.random() * ROUND_EVENTS.length)];
  return {
    id: event.id,
    timeBombRoll: event.id === "time_bomb" ? Math.floor(Math.random() * 7) + 4 : null,
  };
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
    resilientBankUsed: state.resilientBankUsed,
    timeBombRoll: state.timeBombRoll,
    superpowersUsedThisRound: [...state.superpowersUsedThisRound],
    activeHotStreakPlayerId: state.activeHotStreakPlayerId,
    activeAllInPlayerId: state.activeAllInPlayerId,
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
      resilientBankUsed: false,
      timeBombRoll: null,
      superpowersUsedThisRound: [],
      activeHotStreakPlayerId: null,
      activeAllInPlayerId: null,

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

        const basePlayers = state.players.map((p) => ({
          ...p,
          score: 0,
          consecutiveBanks: 0,
        }));
        const resetPlayers = assignSuperpowers(basePlayers, state.superpowersEnabled);

        set({
          phase: "playing",
          currentRound: 1,
          bank: 0,
          rollCount: 0,
          bankedThisRound: [],
          isBust: false,
          lastDie1: null,
          lastDie2: null,
          ...(() => { const ev = state.roundEventsEnabled ? pickRandomEvent() : null; return { activeRoundEvent: ev?.id ?? null, timeBombRoll: ev?.timeBombRoll ?? null }; })(),
          undoSnapshot: null,
          undoLabel: null,
          gameLog: [],
          roundSummary: null,
          roundSummaryRound: 0,
          devilsMercyUsed: false,
          resilientBankUsed: false,
          superpowersUsedThisRound: [],
          activeHotStreakPlayerId: null,
          activeAllInPlayerId: null,
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
          resilientBankUsed: false,
          timeBombRoll: null,
          superpowersUsedThisRound: [],
          activeHotStreakPlayerId: null,
          activeAllInPlayerId: null,
          roundSummary: null,
          roundSummaryRound: 0,
          players: state.players.map((p) => ({ ...p, score: 0, consecutiveBanks: 0, superpower: null })),
        });
      },

      // --- Gameplay Actions ---

      handleRoll: (die1: number, die2: number, forceNotDouble = false) => {
        const state = get();
        if (state.phase !== "playing" || state.isBust) return;

        const snapshot = takeSnapshot(state);
        const rc = state.rollCount;
        const safeZoneLimit = getSafeZoneRolls(state);

        // Determine whose turn it is so armed powers only fire for their owner
        const turnOrder = getTurnOrder(state.players, state.activeRoundEvent, state.currentRound, state.ghostsActiveUntilRound);
        const currentRollerId = turnOrder[state.currentRollerIndex % turnOrder.length]?.id ?? null;

        // Hot Streak: if armed and roll would be a danger-zone 7, silently replace with non-7
        let d1 = die1, d2 = die2;
        const armedHotStreakId = (state.activeHotStreakPlayerId === currentRollerId) ? state.activeHotStreakPlayerId : null;
        let hotStreakFired = false;
        if (armedHotStreakId && state.superpowersEnabled && rc >= safeZoneLimit && d1 + d2 === 7) {
          do {
            d1 = Math.floor(Math.random() * 6) + 1;
            d2 = Math.floor(Math.random() * 6) + 1;
          } while (d1 + d2 === 7);
          hotStreakFired = true;
        }

        const sum = d1 + d2;
        const isDouble = !forceNotDouble && d1 === d2;
        // Golden Totals: 10/11/12 in danger zone count as doubles
        const isEffectiveDouble = isDouble ||
          (state.activeRoundEvent === "golden_totals" && rc >= safeZoneLimit && (sum === 10 || sum === 11 || sum === 12));
        const armedAllInId = (state.activeAllInPlayerId === currentRollerId) ? state.activeAllInPlayerId : null;
        // Time Bomb: a hidden roll number that forces a bust
        const isTimeBomb = state.activeRoundEvent === "time_bomb" &&
          state.timeBombRoll !== null && rc + 1 === state.timeBombRoll;
        let bankAfter = state.bank;
        let wasBust = false;
        let secondChancePlayerId: string | null = null;
        let allInFired = false;
        let allInBustPlayerId: string | null = null;

        if (rc < safeZoneLimit) {
          const luckySevenBonus = state.activeRoundEvent === "heavenly_sevens" ? 140 : 70;
          bankAfter = state.bank + (sum === 7 ? luckySevenBonus : sum);
        } else {
          if (isTimeBomb) {
            // Time Bomb overrides everything — unstoppable bust
            bankAfter = 0;
            wasBust = true;
          } else if (isEffectiveDouble) {
            if (armedAllInId && state.superpowersEnabled) {
              // All-In: 5× the bank on doubles
              bankAfter = state.bank * 5;
              allInFired = true;
            } else {
              const multiplier = state.activeRoundEvent === "triple_threat" ? 3 : 2;
              bankAfter = state.bank * multiplier;
            }
          } else if (sum === 7) {
            if (armedAllInId && state.superpowersEnabled) {
              // All-In: always bust AND player loses their entire score
              bankAfter = 0;
              wasBust = true;
              allInFired = true;
              allInBustPlayerId = armedAllInId;
            } else if (state.activeRoundEvent === "resilient_bank" && !state.resilientBankUsed) {
              // Resilient Bank: first danger-zone 7 only halves the bank
              bankAfter = Math.floor(state.bank / 2);
            } else if (state.activeRoundEvent === "devils_mercy" && !state.devilsMercyUsed) {
              bankAfter = state.bank + 7;
            } else {
              // Second Chance: one player's power prevents the bust entirely — bank saved, round continues
              const scPlayer = state.superpowersEnabled
                ? state.players.find(
                    (p) =>
                      p.superpower === "second_chance" &&
                      !state.bankedThisRound.includes(p.id) &&
                      !state.superpowersUsedThisRound.includes(p.id) &&
                      !p.isGhost
                  )
                : null;
              if (scPlayer) {
                bankAfter = state.bank; // bank saved, no bust
                secondChancePlayerId = scPlayer.id;
              } else {
                bankAfter = 0;
                wasBust = true;
              }
            }
          } else {
            bankAfter = state.bank + sum;
          }
        }

        // If All-In player rolled a 7 and busts, zero out their score
        let playersAfterRoll = state.players;
        if (allInBustPlayerId) {
          playersAfterRoll = state.players.map((p) =>
            p.id === allInBustPlayerId ? { ...p, score: 0 } : p
          );
        }

        // Build log entry
        let logMsg = hotStreakFired
          ? `🔥 Hot Streak! Roll #${rc + 1}: ${d1}+${d2}=${sum} → Bank: ${bankAfter}`
          : `Roll #${rc + 1}: ${d1}+${d2}=${sum}`;
        if (!hotStreakFired) {
          if (isTimeBomb) {
            logMsg += " → 💣 TIME BOMB! BUST!";
          } else if (allInFired && allInBustPlayerId) {
            const allInName = state.players.find((p) => p.id === allInBustPlayerId)?.name ?? "Someone";
            logMsg += ` → ALL-IN BUST! ${allInName} loses all their score!`;
          } else if (allInFired) {
            logMsg += ` → ALL-IN DOUBLES! Bank 5×'d to ${bankAfter}`;
          } else if (wasBust) {
            logMsg += " → BUST!";
          } else if (secondChancePlayerId) {
            const scName = state.players.find((p) => p.id === secondChancePlayerId)?.name ?? "Someone";
            logMsg += ` → ${scName}'s Second Chance! Bank saved at ${bankAfter}`;
          } else if (sum === 7 && rc >= safeZoneLimit && state.activeRoundEvent === "resilient_bank" && !state.resilientBankUsed) {
            logMsg += ` → RESILIENT BANK! Halved to ${bankAfter}`;
          } else if (sum === 7 && rc >= safeZoneLimit && state.activeRoundEvent === "devils_mercy") {
            logMsg += ` → DEVIL'S MERCY! +7 (Bank: ${bankAfter})`;
          } else if (isEffectiveDouble && rc >= safeZoneLimit) {
            const isGolden = !isDouble && state.activeRoundEvent === "golden_totals";
            const mult = state.activeRoundEvent === "triple_threat" ? 3 : (allInFired ? 5 : 2);
            logMsg += isGolden
              ? ` → GOLDEN TOTAL! Bank ${mult === 3 ? "tripled" : "doubled"} to ${bankAfter}`
              : ` → DOUBLES! Bank ${mult === 3 ? "tripled" : "doubled"} to ${bankAfter}`;
          } else if (sum === 7 && rc < safeZoneLimit) {
            const bonusAmt = state.activeRoundEvent === "heavenly_sevens" ? 140 : 70;
            logMsg += ` → Lucky 7! +${bonusAmt} (Bank: ${bankAfter})`;
          } else {
            logMsg += ` → Bank: ${bankAfter}`;
          }
        }

        // Track power usage
        let newSuperpowersUsed = state.superpowersUsedThisRound;
        if (armedHotStreakId) newSuperpowersUsed = [...newSuperpowersUsed, armedHotStreakId];
        if (secondChancePlayerId) newSuperpowersUsed = [...newSuperpowersUsed, secondChancePlayerId];
        if (allInFired && armedAllInId) newSuperpowersUsed = [...newSuperpowersUsed, armedAllInId];

        const nextRollerIndex = advanceRollerIndex(
          state.currentRollerIndex,
          turnOrder,
          state.bankedThisRound,
          state.currentRound,
          state.ghostsActiveUntilRound
        );

        set({
          players: playersAfterRoll,
          bank: bankAfter,
          rollCount: rc + 1,
          isBust: wasBust,
          lastDie1: d1,
          lastDie2: d2,
          currentRollerIndex: nextRollerIndex,
          superpowersUsedThisRound: newSuperpowersUsed,
          activeHotStreakPlayerId: armedHotStreakId ? null : state.activeHotStreakPlayerId,
          // All-In clears only in danger zone (safe zone rolls keep it armed)
          activeAllInPlayerId: (armedAllInId && rc >= safeZoneLimit) ? null : state.activeAllInPlayerId,
          undoSnapshot: snapshot,
          undoLabel: `Roll #${rc + 1}: ${d1}+${d2}`,
          gameLog: [logMsg, ...state.gameLog].slice(0, 50),
          devilsMercyUsed: state.devilsMercyUsed || (sum === 7 && rc >= safeZoneLimit && state.activeRoundEvent === "devils_mercy" && !state.devilsMercyUsed),
          resilientBankUsed: state.resilientBankUsed || (sum === 7 && rc >= safeZoneLimit && state.activeRoundEvent === "resilient_bank" && !state.resilientBankUsed),
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

        // Bank Parasite: passive siphon +100 each time anyone else banks (supports multiple parasites)
        const parasitePlayers = state.superpowersEnabled
          ? state.players.filter(
              (p) =>
                p.superpower === "bank_parasite" &&
                !p.isGhost &&
                !state.bankedThisRound.includes(p.id) &&
                p.id !== playerId
            )
          : [];
        if (parasitePlayers.length > 0) {
          const parasiteIds = new Set(parasitePlayers.map((p) => p.id));
          updatedPlayers = updatedPlayers.map((p) =>
            parasiteIds.has(p.id) ? { ...p, score: p.score + 100 } : p
          );
        }

        let newBanked = [...state.bankedThisRound, playerId];
        const streakBonus = player.consecutiveBanks >= 5 ? 50 : player.consecutiveBanks >= 3 ? 25 : 0;
        let logMsg = `${player.name} BANKED ${amount} pts! (Total: ${updatedPlayers.find(p => p.id === playerId)!.score})`;
        if (streakBonus > 0) logMsg += ` [+${streakBonus} streak bonus!]`;
        if (parasitePlayers.length > 0) logMsg += ` | 🦠 ${parasitePlayers.map((p) => p.name).join(", ")} siphoned +100!`;

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

          const playersForNextRound = isGameOver
            ? updatedPlayers
            : assignSuperpowers(updatedPlayers, state.superpowersEnabled);

          set({
            players: playersForNextRound,
            bankedThisRound: [],
            superpowersUsedThisRound: [],
            activeHotStreakPlayerId: null,
            activeAllInPlayerId: null,
            bank: 0,
            rollCount: 0,
            isBust: false,
            devilsMercyUsed: false,
            resilientBankUsed: false,
            currentRound: isGameOver ? state.currentRound : nextRound,
            phase: isGameOver ? "finished" : "round_summary",
            lastDie1: null,
            lastDie2: null,
            currentRollerIndex: 0,
            undoSnapshot: snapshot,
            undoLabel: `${player.name} banked ${amount}`,
            roundSummary: summary,
            roundSummaryRound: state.currentRound,
            ...(() => { if (!state.roundEventsEnabled || isGameOver) return { activeRoundEvent: null, timeBombRoll: null }; const ev = pickRandomEvent(); return { activeRoundEvent: ev.id, timeBombRoll: ev.timeBombRoll }; })(),
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
            activeHotStreakPlayerId: state.activeHotStreakPlayerId === playerId ? null : state.activeHotStreakPlayerId,
            activeAllInPlayerId: state.activeAllInPlayerId === playerId ? null : state.activeAllInPlayerId,
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

        // Reset banking streaks for players who didn't bank this round, then assign new superpowers
        const streakResetPlayers = state.players.map((p) => ({
          ...p,
          consecutiveBanks: state.bankedThisRound.includes(p.id) ? p.consecutiveBanks : 0,
        }));
        const updatedPlayers = isGameOver
          ? streakResetPlayers
          : assignSuperpowers(streakResetPlayers, state.superpowersEnabled);

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
          resilientBankUsed: false,
          superpowersUsedThisRound: [],
          activeHotStreakPlayerId: null,
          activeAllInPlayerId: null,
          currentRound: isGameOver ? state.currentRound : nextRound,
          phase: isGameOver ? "finished" : "round_summary",
          roundSummary: summary,
          roundSummaryRound: state.currentRound,
          gameLog: [
            isGameOver ? "Game Over!" : `── Round ${nextRound} ──`,
            ...state.gameLog,
          ].slice(0, 50),
          ...(() => { if (!state.roundEventsEnabled || isGameOver) return { activeRoundEvent: null, timeBombRoll: null }; const ev = pickRandomEvent(); return { activeRoundEvent: ev.id, timeBombRoll: ev.timeBombRoll }; })(),
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
          resilientBankUsed: snapshot.resilientBankUsed,
          timeBombRoll: snapshot.timeBombRoll,
          superpowersUsedThisRound: snapshot.superpowersUsedThisRound,
          activeHotStreakPlayerId: snapshot.activeHotStreakPlayerId,
          activeAllInPlayerId: snapshot.activeAllInPlayerId,
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

      activateHotStreak: (playerId: string) => {
        const state = get();
        if (state.phase !== "playing") return;
        const player = state.players.find((p) => p.id === playerId);
        if (!player || player.superpower !== "hot_streak") return;
        if (state.superpowersUsedThisRound.includes(playerId)) return;
        set({ activeHotStreakPlayerId: playerId });
      },

      deactivateHotStreak: () => {
        set({ activeHotStreakPlayerId: null });
      },

      activateAllIn: (playerId: string) => {
        const state = get();
        if (state.phase !== "playing") return;
        const player = state.players.find((p) => p.id === playerId);
        if (!player || player.superpower !== "all_in") return;
        if (state.superpowersUsedThisRound.includes(playerId)) return;
        set({ activeAllInPlayerId: playerId });
      },

      deactivateAllIn: () => {
        set({ activeAllInPlayerId: null });
      },

      useMirrorMaster: (playerId: string) => {
        const state = get();
        if (state.phase !== "playing" || state.isBust) return;
        if (!state.lastDie1 || !state.lastDie2) return;
        const player = state.players.find((p) => p.id === playerId);
        if (!player || player.superpower !== "mirror_master") return;
        if (state.superpowersUsedThisRound.includes(playerId)) return;
        if (state.bankedThisRound.includes(playerId)) return;

        const snapshot = takeSnapshot(state);
        const d1 = state.lastDie1;
        const d2 = state.lastDie2;
        const sum = d1 + d2;
        const isDouble = d1 === d2;
        const rc = state.rollCount;
        const safeZoneLimit = getSafeZoneRolls(state);

        let bankAfter = state.bank;
        let wasBust = false;
        let secondChancePlayerId: string | null = null;
        const isEffectiveDoubleMM = isDouble ||
          (state.activeRoundEvent === "golden_totals" && rc >= safeZoneLimit && (sum === 10 || sum === 11 || sum === 12));

        if (rc < safeZoneLimit) {
          const luckySevenBonus = state.activeRoundEvent === "heavenly_sevens" ? 140 : 70;
          bankAfter = state.bank + (sum === 7 ? luckySevenBonus : sum);
        } else {
          if (isEffectiveDoubleMM) {
            const multiplier = state.activeRoundEvent === "triple_threat" ? 3 : 2;
            bankAfter = state.bank * multiplier;
          } else if (sum === 7) {
            if (state.activeRoundEvent === "resilient_bank" && !state.resilientBankUsed) {
              bankAfter = Math.floor(state.bank / 2);
            } else if (state.activeRoundEvent === "devils_mercy" && !state.devilsMercyUsed) {
              bankAfter = state.bank + 7;
            } else {
              const scPlayer = state.superpowersEnabled
                ? state.players.find(
                    (p) =>
                      p.superpower === "second_chance" &&
                      !state.bankedThisRound.includes(p.id) &&
                      !state.superpowersUsedThisRound.includes(p.id) &&
                      !p.isGhost
                  )
                : null;
              if (scPlayer) {
                bankAfter = state.bank;
                secondChancePlayerId = scPlayer.id;
              } else {
                bankAfter = 0;
                wasBust = true;
              }
            }
          } else {
            bankAfter = state.bank + sum;
          }
        }

        let logMsg = `🪞 ${player.name} used Mirror Master! Copied ${d1}+${d2}=${sum}`;
        if (wasBust) logMsg += " → BUST!";
        else if (secondChancePlayerId) {
          const scName = state.players.find((p) => p.id === secondChancePlayerId)?.name ?? "Someone";
          logMsg += ` → ${scName}'s Second Chance! Bank saved at ${bankAfter}`;
        } else logMsg += ` → Bank: ${bankAfter}`;

        let newSuperpowersUsed = [...state.superpowersUsedThisRound, playerId];
        if (secondChancePlayerId) newSuperpowersUsed = [...newSuperpowersUsed, secondChancePlayerId];

        const turnOrder = getTurnOrder(state.players, state.activeRoundEvent, state.currentRound, state.ghostsActiveUntilRound);
        const nextRollerIndex = advanceRollerIndex(
          state.currentRollerIndex, turnOrder, state.bankedThisRound,
          state.currentRound, state.ghostsActiveUntilRound
        );

        set({
          bank: bankAfter,
          rollCount: rc + 1,
          isBust: wasBust,
          lastDie1: d1,
          lastDie2: d2,
          currentRollerIndex: nextRollerIndex,
          superpowersUsedThisRound: newSuperpowersUsed,
          undoSnapshot: snapshot,
          undoLabel: `Mirror Master: ${d1}+${d2}`,
          gameLog: [logMsg, ...state.gameLog].slice(0, 50),
          devilsMercyUsed: state.devilsMercyUsed || (sum === 7 && rc >= safeZoneLimit && state.activeRoundEvent === "devils_mercy"),
          resilientBankUsed: state.resilientBankUsed || (sum === 7 && rc >= safeZoneLimit && state.activeRoundEvent === "resilient_bank"),
        });
      },

      useDiceDoctor: (playerId: string, newDie1: number, newDie2: number) => {
        const state = get();
        const preRoll = state.undoSnapshot;
        if (!preRoll || state.isBust || state.phase !== "playing") return;
        const player = state.players.find((p) => p.id === playerId);
        if (!player || player.superpower !== "dice_doctor") return;
        if (state.superpowersUsedThisRound.includes(playerId)) return;
        if (state.bankedThisRound.includes(playerId)) return;

        const d1 = Math.min(6, Math.max(1, newDie1));
        const d2 = Math.min(6, Math.max(1, newDie2));
        const sum = d1 + d2;
        const isDouble = d1 === d2;
        const rc = preRoll.rollCount;
        const safeZoneLimit = getSafeZoneRolls(state);

        let bankAfter = preRoll.bank;
        let wasBust = false;
        let secondChancePlayerId: string | null = null;
        const isEffectiveDoubleDD = isDouble ||
          (state.activeRoundEvent === "golden_totals" && rc >= safeZoneLimit && (sum === 10 || sum === 11 || sum === 12));

        if (rc < safeZoneLimit) {
          const luckySevenBonus = state.activeRoundEvent === "heavenly_sevens" ? 140 : 70;
          bankAfter = preRoll.bank + (sum === 7 ? luckySevenBonus : sum);
        } else {
          if (isEffectiveDoubleDD) {
            const multiplier = state.activeRoundEvent === "triple_threat" ? 3 : 2;
            bankAfter = preRoll.bank * multiplier;
          } else if (sum === 7) {
            if (state.activeRoundEvent === "resilient_bank" && !preRoll.resilientBankUsed) {
              bankAfter = Math.floor(preRoll.bank / 2);
            } else if (state.activeRoundEvent === "devils_mercy" && !preRoll.devilsMercyUsed) {
              bankAfter = preRoll.bank + 7;
            } else {
              const scPlayer = state.superpowersEnabled
                ? preRoll.players.find(
                    (p) =>
                      p.superpower === "second_chance" &&
                      !preRoll.bankedThisRound.includes(p.id) &&
                      !preRoll.superpowersUsedThisRound.includes(p.id) &&
                      !p.isGhost
                  )
                : null;
              if (scPlayer) {
                bankAfter = preRoll.bank;
                secondChancePlayerId = scPlayer.id;
              } else {
                bankAfter = 0;
                wasBust = true;
              }
            }
          } else {
            bankAfter = preRoll.bank + sum;
          }
        }

        let logMsg = `💊 ${player.name} used Dice Doctor! Adjusted → ${d1}+${d2}=${sum}`;
        if (wasBust) logMsg += " → BUST!";
        else if (secondChancePlayerId) {
          const scName = preRoll.players.find((p) => p.id === secondChancePlayerId)?.name ?? "Someone";
          logMsg += ` → ${scName}'s Second Chance! Bank saved at ${bankAfter}`;
        } else logMsg += ` → Bank: ${bankAfter}`;

        let newSuperpowersUsed = [...preRoll.superpowersUsedThisRound, playerId];
        if (secondChancePlayerId) newSuperpowersUsed = [...newSuperpowersUsed, secondChancePlayerId];

        const turnOrder = getTurnOrder(preRoll.players, state.activeRoundEvent, state.currentRound, state.ghostsActiveUntilRound);
        const nextRollerIndex = advanceRollerIndex(
          preRoll.currentRollerIndex, turnOrder, preRoll.bankedThisRound,
          state.currentRound, state.ghostsActiveUntilRound
        );

        set({
          players: preRoll.players,
          bankedThisRound: preRoll.bankedThisRound,
          superpowersUsedThisRound: newSuperpowersUsed,
          bank: bankAfter,
          rollCount: rc + 1,
          isBust: wasBust,
          lastDie1: d1,
          lastDie2: d2,
          currentRollerIndex: nextRollerIndex,
          undoSnapshot: preRoll,
          undoLabel: `Dice Doctor: ${d1}+${d2}=${sum}`,
          gameLog: [logMsg, ...preRoll.gameLog].slice(0, 50),
          devilsMercyUsed: preRoll.devilsMercyUsed || (sum === 7 && rc >= safeZoneLimit && state.activeRoundEvent === "devils_mercy"),
          resilientBankUsed: preRoll.resilientBankUsed || (sum === 7 && rc >= safeZoneLimit && state.activeRoundEvent === "resilient_bank"),
        });
      },

      rerollWithWhisperer: (playerId: string, newDie1: number, newDie2: number) => {
        const state = get();
        const preRoll = state.undoSnapshot;
        if (!preRoll || state.isBust || state.phase !== "playing") return;

        const player = state.players.find((p) => p.id === playerId);
        if (!player || player.superpower !== "dice_whisperer") return;
        if (state.superpowersUsedThisRound.includes(playerId)) return;
        if (state.bankedThisRound.includes(playerId)) return;

        // Recompute roll result from pre-roll state with new dice
        const die1 = newDie1, die2 = newDie2;
        const sum = die1 + die2;
        const isDouble = die1 === die2;
        const rc = preRoll.rollCount;
        const safeZoneLimit = getSafeZoneRolls(state);

        let bankAfter = preRoll.bank;
        let wasBust = false;
        const isEffectiveDoubleWW = isDouble ||
          (state.activeRoundEvent === "golden_totals" && rc >= safeZoneLimit && (sum === 10 || sum === 11 || sum === 12));

        if (rc < safeZoneLimit) {
          const luckySevenBonus = state.activeRoundEvent === "heavenly_sevens" ? 140 : 70;
          bankAfter = preRoll.bank + (sum === 7 ? luckySevenBonus : sum);
        } else {
          const multiplier = state.activeRoundEvent === "triple_threat" ? 3 : 2;
          if (isEffectiveDoubleWW) {
            bankAfter = preRoll.bank * multiplier;
          } else if (sum === 7) {
            if (state.activeRoundEvent === "resilient_bank" && !preRoll.resilientBankUsed) {
              bankAfter = Math.floor(preRoll.bank / 2);
            } else if (state.activeRoundEvent === "devils_mercy" && !preRoll.devilsMercyUsed) {
              bankAfter = preRoll.bank + 7;
            } else {
              bankAfter = 0;
              wasBust = true;
            }
          } else {
            bankAfter = preRoll.bank + sum;
          }
        }

        // Second Chance: if the rerolled result would bust, check for bust prevention
        let secondChancePlayerId: string | null = null;
        if (wasBust && state.superpowersEnabled) {
          const scPlayer = preRoll.players.find(
            (p) =>
              p.superpower === "second_chance" &&
              !preRoll.bankedThisRound.includes(p.id) &&
              !preRoll.superpowersUsedThisRound.includes(p.id) &&
              !p.isGhost
          );
          if (scPlayer) {
            bankAfter = preRoll.bank;
            wasBust = false;
            secondChancePlayerId = scPlayer.id;
          }
        }

        let logMsg = `✨ ${player.name} used Dice Whisperer! Rerolled → ${die1}+${die2}=${sum}`;
        if (wasBust) logMsg += " → BUST!";
        else if (secondChancePlayerId) {
          const scName = preRoll.players.find((p) => p.id === secondChancePlayerId)?.name ?? "Someone";
          logMsg += ` → ${scName}'s Second Chance! Bank saved at ${bankAfter}`;
        } else logMsg += ` → Bank: ${bankAfter}`;

        let newSuperpowersUsed = [...preRoll.superpowersUsedThisRound, playerId];
        if (secondChancePlayerId) newSuperpowersUsed = [...newSuperpowersUsed, secondChancePlayerId];

        const turnOrder = getTurnOrder(preRoll.players, state.activeRoundEvent, state.currentRound, state.ghostsActiveUntilRound);
        const nextRollerIndex = advanceRollerIndex(
          preRoll.currentRollerIndex,
          turnOrder,
          preRoll.bankedThisRound,
          state.currentRound,
          state.ghostsActiveUntilRound
        );

        set({
          players: preRoll.players,
          bankedThisRound: preRoll.bankedThisRound,
          superpowersUsedThisRound: newSuperpowersUsed,
          bank: bankAfter,
          rollCount: rc + 1,
          isBust: wasBust,
          lastDie1: die1,
          lastDie2: die2,
          currentRollerIndex: nextRollerIndex,
          undoSnapshot: preRoll,
          undoLabel: `Whisperer: ${die1}+${die2}=${sum}`,
          gameLog: [logMsg, ...preRoll.gameLog].slice(0, 50),
          devilsMercyUsed: preRoll.devilsMercyUsed || (sum === 7 && rc >= safeZoneLimit && state.activeRoundEvent === "devils_mercy"),
          resilientBankUsed: preRoll.resilientBankUsed || (sum === 7 && rc >= safeZoneLimit && state.activeRoundEvent === "resilient_bank"),
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
        ghostsActiveUntilRound: state.ghostsActiveUntilRound,
        superpowersUsedThisRound: state.superpowersUsedThisRound,
        activeHotStreakPlayerId: state.activeHotStreakPlayerId,
        activeAllInPlayerId: state.activeAllInPlayerId,
        resilientBankUsed: state.resilientBankUsed,
        timeBombRoll: state.timeBombRoll,
      }),
    }
  )
);

// --- Selectors ---

export const getSafeZoneRolls = (state: GameState) =>
  state.activeRoundEvent === "extended_safety" ? 5 : state.activeRoundEvent === "short_fuse" ? 1 : 3;

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
