# BANK! Dice Game — Claude Code Context

## Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Static export → /out
npm run lint     # ESLint
npx tsc --noEmit # Type-check without building
```

> `output: "export"` in next.config.ts — no SSR, no API routes, no server components with data fetching.

## Architecture

- **All game logic lives in `src/store/game-store.ts`** — components are pure consumers via selectors
- **Phase router in `src/app/page.tsx`**: `"setup" | "playing" | "round_summary" | "finished"`
- **Desktop layout in `src/app/page.tsx`**: `md:flex-row` split — left half player list, right half score panel (bank, round/roll, dice grid, bank button). Mobile collapses to single column with fixed bottom bar.
- **Persistence**: Zustand `persist` middleware → `localStorage` key `bank-dice-game-v3`. `partialize` controls what's saved — add new state fields there if they need to survive refresh
- **Undo**: `undoSnapshot: StateSnapshot | null` captured before every mutating action. When adding new state fields, add them to `StateSnapshot` and restore them in `undo`

## Key Files

| File | Purpose |
|------|---------|
| `src/store/game-store.ts` | All types, constants, game logic, selectors |
| `src/app/page.tsx` | Phase router, desktop/mobile layout, bank + roll sheets |
| `src/components/top-bar.tsx` | Mobile-only header (undo, reset, event badge); hidden on desktop |
| `src/components/player-list.tsx` | Per-player cards, rank colors, superpower badges (`POWER_STYLES`); card sizes adapt to player count |
| `src/components/bank-display.tsx` | Bank value with danger-zone glow and animated count |
| `src/components/roll-controls.tsx` | Sum input grid (2–12, doubles), keyboard shortcuts |
| `src/lib/sounds.ts` | Synthesized Web Audio API sounds — no audio files |
| `src/lib/utils.ts` | `cn()` Tailwind merge helper |

## Game Mechanic Zones

- **Safe zone** (rolls 1–3 by default, 5 with Extended Safety event, 1 with Short Fuse): sums add to bank; 7 = +70 bonus (or +140 with Heavenly Sevens)
- **Danger zone** (roll 4+): doubles = 2× bank (3× with Triple Threat); 7 = BUST
- Zone boundary: `getSafeZoneRolls(state)` selector (accounts for active event)

## Desktop / TV Layout

- Right panel visible only at `md:` breakpoint and above
- All right-panel text scales with `xl:` and `2xl:` breakpoints for TV casting
- Player cards on the left scale in 3 tiers based on `players.length`:
  - 1–5 players: large (xl–2xl sizes)
  - 6–7 players: medium
  - 8+ players: compact
- Left panel uses `overflow-y-auto` with hidden scrollbar as overflow fallback
- Fullscreen toggle button in top-right of right panel (`document.documentElement.requestFullscreen()`)
- Bank sheet on desktop is constrained to right half: `fixed inset-0 md:left-1/2`
- Top bar is `md:hidden` — undo/reset/fullscreen live in the right panel on desktop

## Roll Order Across Rounds

`lastRollerId: string | null` in `GameState` (and `StateSnapshot`) tracks who physically rolled the dice last.

- Set in `handleRoll` to `currentRollerId` before `advanceRollerIndex` runs
- `advanceRound` (bust) and `handleBank` (all humans banked) both call `computeNextRoundStartIndex(state.lastRollerId, players)` to start the next round from the correct player
- **Why this matters**: `handleRoll` always calls `advanceRollerIndex` even on bust, so `currentRollerIndex` is already one step past the actual last roller by the time the round ends. Using `lastRollerId` directly avoids the double-advance.

## Adding a New Superpower

1. **Add to `SUPERPOWERS` registry** in `game-store.ts`:
   ```ts
   { id: "your_id", name: "Display Name", description: "...", color: "color-name" }
   ```
2. **Add activation state** to `GameState` interface and initial state if the power needs runtime flags
3. **Add to `StateSnapshot`** if state must survive undo
4. **Wire logic** into `handleRoll` and/or `handleBank`
5. **Mark consumed**: push player ID into `superpowersUsedThisRound`
6. **Add badge style** to `POWER_STYLES` map in `player-list.tsx`
7. **Add description card** in `top-bar.tsx` superpowers info modal

### Existing Superpowers
| ID | Color | Behavior |
|----|-------|---------|
| `second_chance` | emerald | PASSIVE — prevents bust; fires before `wasBust` is set |
| `dice_whisperer` | violet | POST-ROLL — opens die-selection dialog; `rerollWithWhisperer` handles recompute |
| `hot_streak` | orange | PRE-ROLL — player taps badge to arm (`activeHotStreakPlayerId`); replaces danger-zone 7 |

## Adding a New Round Event

1. **Add to `ROUND_EVENTS`** array in `game-store.ts`:
   ```ts
   { id: "your_id", name: "Display Name", description: "..." }
   ```
2. **Add event flag** to `GameState` if it needs per-round state (like `devilsMercyUsed`, `timeBombRoll`)
3. **Wire logic** into `handleRoll`/`handleBank` checking `activeRoundEvent === "your_id"`
4. **Add to `EVENT_PANEL_STYLES`** in `page.tsx` and the badge maps in `top-bar.tsx` / `bank-display.tsx`

### Existing Round Events
| ID | Display Name |
|----|-------------|
| `triple_threat` | Triple Threat |
| `extended_safety` | Extended Safety |
| `ghost_overdrive` | Ghost Overdrive |
| `heavenly_sevens` | Heavenly Sevens |
| `devils_mercy` | Devil's Mercy |
| `short_fuse` | Short Fuse |
| `golden_totals` | Golden Totals |
| `resilient_bank` | Brazilian Bank |
| `time_bomb` | Time Bomb |

## Superpowers System Notes

- `superpowersEnabled` toggle (pink Sparkles icon in TopBar)
- Assignment: `assignSuperpowers()` runs at `startGame` and `advanceRound`; one per human player, ghosts get `null`
- Reset: `superpowersUsedThisRound` and `activeHotStreakPlayerId` reset when all humans bank
- `rerollWithWhisperer` starts from a pre-roll snapshot — intentionally duplicates roll logic

## Sounds & Haptics

- All sounds synthesized via Web Audio API in `src/lib/sounds.ts` — no external files
- Haptic feedback via `navigator.vibrate()` where supported
- `AudioContext` is lazy-initialized and resumed on each call (browser autoplay policy)

## Gotchas

- **Static export**: `npm run build` outputs to `/out`. No `getServerSideProps`, no API routes, no `headers()`/`cookies()` calls
- **localStorage key**: If you change persisted state shape significantly, bump the version (currently `bank-dice-game-v5`) to avoid stale state crashes
- **Undo system**: Any new `GameState` field that a user-visible action can change must be added to `StateSnapshot` — otherwise undo silently leaves it in the wrong state
- **`lastRollerId` in snapshots**: Must be included in `StateSnapshot` — if a user undoes a roll, `lastRollerId` must revert to the pre-roll value so the next round still starts correctly
- **`handleRoll` always advances `currentRollerIndex`**, even on bust. Never use `currentRollerIndex` to find "who just rolled" — use `lastRollerId` instead
- **Ghost AI**: Ghost behavior is driven inside `handleRoll` — ghosts always roll 7 in safe zone, doubles in danger zone
- **`dice.tsx`** is unused dead code — the virtual dice feature was removed; the file can be deleted
