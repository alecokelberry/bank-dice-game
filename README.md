# BANK! Dice Game

A browser-based multiplayer dice game built with **Next.js 16**, **TypeScript**, and **Zustand**. Players share a communal bank that grows with each dice roll, deciding when to cash out before someone rolls a 7 and busts everything.

**[Play it live on Vercel](https://bank-dice-game.vercel.app)**

---

## How to Play

1. **Setup** — Add 2+ players and choose the round count (10, 15, or 20)
2. **Safe Zone** (rolls 1-3) — Every roll adds to the shared bank. Rolling a **7 is lucky and adds +70 pts**
3. **Danger Zone** (roll 4+) — Rolling **doubles** multiplies the bank **2x**. Rolling a **7 busts** the bank and everyone who hasn't banked yet loses everything
4. **Bank** anytime after the first roll to lock in the current bank value as your score
5. The round ends when all players have banked or a bust occurs
6. **Highest score after all rounds wins!**

### Controls

| Input              | Action                                  |
| ------------------ | --------------------------------------- |
| Sum buttons (2-11) | Enter the sum you rolled with real dice |
| Doubles button     | Enter a doubles roll (danger zone only) |
| `Space` / `R`      | Roll the virtual dice                   |
| `D`                | Submit doubles                          |
| `B`                | Bank the first unbanked player          |
| `1`-`9`            | Bank a specific player by position      |
| `U`                | Undo last action                        |

---

## Tech Stack

| Technology                                                   | Purpose                                                       |
| ------------------------------------------------------------ | ------------------------------------------------------------- |
| [Next.js 16](https://nextjs.org/)                            | React framework with App Router and static export             |
| [TypeScript](https://www.typescriptlang.org/)                | End-to-end type safety                                        |
| [Zustand](https://github.com/pmndrs/zustand)                 | Lightweight global state management with `persist` middleware |
| [Framer Motion](https://www.framer.com/motion/)              | Smooth animations and transitions                             |
| [Tailwind CSS v4](https://tailwindcss.com/)                  | Utility-first styling                                         |
| [Lucide React](https://lucide.dev/)                          | Consistent icon library                                       |
| [canvas-confetti](https://github.com/catdad/canvas-confetti) | Win screen celebration effects                                |
| [Sonner](https://sonner.emilkowal.ski/)                      | Toast notifications                                           |
| [Vercel](https://vercel.com/)                                | Hosting and continuous deployment                             |

---

## Features

- **2-8 players** with custom names, assigned colors, and configurable turn order
- **Configurable round count** — 10, 15, or 20 rounds
- **Dual input modes** — tap sum buttons for physical dice, or use the built-in virtual dice roller
- **Banking streak bonus** — +25 pts for 3 consecutive banks, +50 pts for 5+
- **Snapshot-based undo** — full state rewind for the last action
- **Synthesized sound effects** — all audio generated via Web Audio API (zero external files)
- **Haptic feedback** — vibration on mobile for rolls, banks, and busts
- **State persistence** — game state survives page refreshes via `localStorage`
- **Responsive design** — mobile-first layout with a desktop sidebar
- **Between-round summaries** — ranked standings shown after each round

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout with metadata and viewport config
│   ├── page.tsx                # Phase-based game router (setup -> playing -> finished)
│   └── globals.css             # Tailwind imports and global styles
├── components/
│   ├── ui/
│   │   ├── button.tsx          # Reusable button with variant/size props
│   │   └── dialog.tsx          # Animated modal dialog component
│   ├── bank-display.tsx        # Animated bank counter with danger-zone glow
│   ├── bust-overlay.tsx        # Full-screen bust notification with screen shake
│   ├── dice.tsx                # SVG dice faces with rolling animation
│   ├── player-list.tsx         # Player sidebar with bank buttons and turn indicators
│   ├── roll-controls.tsx       # Sum input grid and keyboard shortcut handler
│   ├── round-summary.tsx       # Between-round standings overlay
│   ├── settings-dialog.tsx     # Mid-game settings editor
│   ├── setup-screen.tsx        # Pre-game player and round configuration
│   ├── top-bar.tsx             # Navigation bar with round info, undo, and reset
│   └── winner-screen.tsx       # End-game leaderboard with confetti
├── lib/
│   ├── sounds.ts               # Web Audio API synthesized sounds and haptic feedback
│   └── utils.ts                # Tailwind class merge utility
└── store/
    └── game-store.ts           # Zustand store with all game state, types, and logic
```

---

## Architecture

**Centralized state** — All game logic lives in a single Zustand store (`game-store.ts`). Components are pure consumers that read via selectors and dispatch actions. This makes the data flow predictable and easy to debug.

**Persist middleware** — The store serializes to `localStorage` on every state change, so games survive page refreshes. The storage key is versioned to prevent stale data from breaking the app after updates.

**Static export** — Built as a fully static site (`output: "export"` in `next.config.ts`). No server required — zero cold starts, instant loads, deployable to any CDN.

**Snapshot undo** — Before every roll or bank action, the entire game state is captured in an `undoSnapshot`. Undo is a single atomic state swap, guaranteeing consistency.

**Component composition** — The main page acts as a phase-based router, rendering `SetupScreen`, the playing UI, or `WinnerScreen` based on game phase. Overlays like `BustOverlay` and `RoundSummary` layer on top via fixed positioning and z-index.

---

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev       # http://localhost:3000

# Build for production (static export -> /out)
npm run build
```

---

## Development Approach

I designed every core mechanic, UI flow, state architecture (Zustand with persistence + undo snapshots), turn-order logic, audio/haptics system, and win conditions myself.

To accelerate iteration and ship a polished, production-ready game in under two weeks, I leveraged **Claude Code** as an AI coding assistant — the same way senior engineers use pair-programming tools today. I wrote every prompt, reviewed and refined 100% of the code, handled all edge cases, performed final testing, and managed deployment. This workflow let me focus on high-level problem-solving while moving extremely fast.

---

## About

Built by **Alec Okelberry** — BSCS student at Western Governors University.

- GitHub: [@alecokelberry](https://github.com/alecokelberry)

---

## License

MIT
