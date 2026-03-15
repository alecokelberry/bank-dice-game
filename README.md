# BANK! Dice Game

A browser-based multiplayer dice game built with Next.js 16, TypeScript, and Zustand. Players share a communal bank that grows with each roll — cash out before someone rolls a 7 and wipes it.

**[Play it on Vercel](https://bank-dice-game.vercel.app)**

---

## Inspiration

Based on **BANK!**, a physical dice game by [Thunder Hive Games](https://www.thunderhivegames.com). Check out the original if you enjoy the app.

---

## How to Play

**Safe Zone (rolls 1–3 by default)**
Each roll adds its total to the shared bank. Rolling a 7 is lucky and adds +70.

**Danger Zone (roll 4+)**
Doubles multiply the bank by 2×. Rolling a 7 busts the bank — everyone still in scores 0 for the round.

**Banking**
You can bank after the first roll. Banking locks in the current bank value as your score for the round. The round ends when everyone banks or a bust happens.

**Winning**
Highest total score after all rounds wins.

---

## Controls

| Input | Action |
| --- | --- |
| Sum buttons (2–11) | Enter the sum of the dice you rolled |
| 12 button | Enter a 12 (safe zone only) |
| Doubles button | Enter a doubles roll (danger zone only) |
| Space / R | Roll the built-in virtual dice |
| D | Submit doubles |
| B | Bank the first unbanked player |
| 1–9 | Bank a specific player by position |
| U | Undo the last action |

---

## Round Events

When enabled, one event is randomly picked at the start of each round:

| Event | Effect |
| --- | --- |
| **Triple Threat** | Hit doubles and the bank triples instead of doubling. |
| **Extended Safety** | Safe zone runs for 5 rolls this round instead of 3. |
| **Ghost Overdrive** | Every ghost rolls twice per turn this round. |
| **Heavenly Sevens** | 7s in the safe zone are worth +140 instead of +70. |
| **Devil's Mercy** | The first 7 in the danger zone won't bust — it just adds 7 and play continues. |
| **Short Fuse** | Safe zone is only 1 roll this round. Danger comes fast. |
| **Golden Totals** | Any roll totaling 10, 11, or 12 counts as doubles. |
| **Resilient Bank** | The first danger-zone 7 halves the bank instead of busting it. |
| **Time Bomb** | 7 won't bust this round — but one number between 2 and 12 is secretly rigged to. Roll it in the danger zone and it's over. |

Only one event is active per round.

---

## Ghost Players

Ghost players roll automatically — always 7s in the safe zone and doubles in the danger zone. Good for filling out a group or keeping the bank from sitting still. You can limit them to the first N rounds or keep them in for the full game.

---

## Features

- 2–8 players with custom names and colors
- Ghost players with configurable round limits
- 9 round events with randomized selection
- Clickable event badges during gameplay
- 10, 15, or 20 round options
- Physical dice input + built-in virtual roller
- Undo for the last roll or bank
- Sound effects via Web Audio API (no external files)
- Haptic feedback on mobile
- Game state persists across page refreshes
- Light and dark mode
- Between-round standings summary
- Edit player names and settings mid-game

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout, metadata, viewport
│   ├── page.tsx            # Phase router (setup → playing → finished)
│   └── globals.css         # Tailwind and global styles
├── components/
│   ├── ui/
│   │   ├── button.tsx      # Button component
│   │   └── dialog.tsx      # Modal dialog
│   ├── bank-display.tsx    # Bank counter, event badges, danger-zone glow
│   ├── bust-overlay.tsx    # Full-screen bust notification
│   ├── dice.tsx            # SVG dice with roll animation
│   ├── player-list.tsx     # Player sidebar with bank buttons and turn indicators
│   ├── roll-controls.tsx   # Sum input grid and keyboard shortcuts
│   ├── round-summary.tsx   # Between-round standings
│   ├── settings-dialog.tsx # Mid-game settings
│   ├── setup-screen.tsx    # Pre-game configuration
│   ├── top-bar.tsx         # Nav bar with undo, virtual dice, theme toggle
│   └── winner-screen.tsx   # End-game leaderboard with confetti
├── lib/
│   ├── sounds.ts           # Web Audio API sounds and haptic feedback
│   └── utils.ts            # Tailwind class merge utility
└── store/
    └── game-store.ts       # All game state, logic, and types (Zustand)
```

---

## Architecture

All game logic lives in a single Zustand store. Components read state via selectors and call named actions — no logic in the components themselves.

State is persisted to `localStorage` via Zustand's persist middleware. Only the fields needed for continuity are saved, and the storage key is versioned so stale data doesn't break things after updates.

Undo works by snapshotting the full game state before every roll or bank, then swapping back to it on demand.

The app builds as a fully static export — no server needed.

---

## Getting Started

```bash
cd ~/developer/bank-dice-game
npm install
npm run dev     # http://localhost:3000
npm run build   # Static export to /out
```

---

## Development

Built across two IDEs — **Visual Studio Code** and **Google Antigravity IDE** — using a mix of AI models depending on the task.

Planning and architecture were worked out using **Grok 4.20 beta** from xAI (via SuperGrok). It uses a multi-agent setup where agents cross-check each other's output, which makes it solid for high-level decisions before writing any code.

Most of the implementation used models from Anthropic and Google:

- **Claude Sonnet 4.6 / Opus 4.6** — feature work, UI components, state logic
- **Gemini 3.1 Pro / Flash** — long-context refactors and quick back-and-forth edits

I treat AI the same way I'd treat any other tool — useful when applied well, a liability when used blindly. I own the architecture, review everything that gets written, and make the product calls. It just means I can move faster doing it.

I completed WGU's Prompt Engineering course in a single day, which reflects how much time I've put into actually understanding how these models reason and where they fall short.

---

## About

Built by **Alec Okelberry** — BSCS student at Western Governors University.

GitHub: [@alecokelberry](https://github.com/alecokelberry)

---

## License

MIT
