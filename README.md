# BANK! Dice Game

A browser-based multiplayer dice game built with **Next.js 16**, **TypeScript**, and **Zustand**. Players share a communal bank that grows with each dice roll, deciding when to cash out before someone rolls a 7 and busts everything.

**[Play it live on Vercel](https://bank-dice-game.vercel.app)**

---

## Inspiration

This game is a digital adaptation of **BANK!**, a physical dice game published by [Thunder Hive Games](https://www.thunderhivegames.com). If you enjoy the app, check out the original — they make great tabletop games.

---

## How to Play

1. **Setup** — Add 2+ players (or AI Ghosts) and choose the round count.
2. **Safe Zone** (rolls 1-3) — Every roll adds to the shared bank. Rolling a **7 is lucky and adds +70 pts**.
3. **Danger Zone** (roll 4+) — Rolling **doubles** multiplies the bank **2x**. Rolling a **7 busts** the bank and everyone who hasn't banked yet loses everything.
4. **Round Events** — If enabled, a random rule-breaking event triggers each round (e.g., Ghost Overdrive, Heavenly Sevens).
5. **Bank** anytime after the first roll to lock in the current bank value as your score.
6. The round ends when all players have banked or a bust occurs.
7. **Highest score after all rounds wins!**

### Controls

| Input              | Action                                          |
| ------------------ | ----------------------------------------------- |
| Sum buttons (2-11) | Enter the sum you rolled with real dice          |
| **12 button**      | Enter a 12 (safe zone only — not a double here) |
| Doubles button     | Enter a doubles roll (danger zone only)         |
| `Space` / `R`      | Roll the virtual dice                           |
| `D`                | Submit doubles                                  |
| `B`                | Bank the first unbanked player                  |
| `1`-`9`            | Bank a specific player by position              |
| `U`                | Undo last action                                |

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
- **AI Ghost Players** — Add automated "Ghost" players with aggressive AI logic that always banks according to the current "safe zone" limit
- **Round Events** — 4+ unique random modifiers like Triple Threat, Extended Safety, and Devil's Mercy
- **Superpowers (Coming Soon)** — Unique character abilities assigned per round
- **Configurable round count** — 10, 15, or 20 rounds
- **Dual input modes** — tap sum buttons for physical dice, or use the built-in virtual dice roller
- **Banking streak bonus** — +25 pts for 3 consecutive banks, +50 pts for 5+
- **Snapshot-based undo** — full state rewind for the last action
- **Synthesized sound effects** — all audio generated via Web Audio API (zero external files)
- **Haptic feedback** — vibration on mobile for rolls, banks, and busts
- **State persistence** — game state survives page refreshes via `localStorage`
- **Responsive design** — mobile-first layout with light/dark mode support
- **Between-round summaries** — ranked standings shown after each round

---

## Round Events

When enabled, a random event is picked at the start of each round to keep the gameplay fresh and chaotic:

| Event             | Description                                                                     |
| ----------------- | ------------------------------------------------------------------------------- |
| **Triple Threat** | Doubles multiply the bank by **3x** instead of 2x.                              |
| **Extended Safety** | The safe zone lasts for **5 rolls** instead of 3.                             |
| **Ghost Overdrive** | Every Ghost rolls **twice** per round (two separate turns).                   |
| **Heavenly Sevens** | Safe-zone 7s give **+140** to the bank instead of +70.                         |
| **Devil’s Mercy** | The **first 7** of the round does not bust — it just adds 7 and continues.      |

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

## Development Approach — AI-Assisted Prototyping

This project is a deliberate showcase of how the next generation of developers can leverage AI coding assistants not as a crutch, but as a **force multiplier** — moving faster, shipping cleaner code, and solving harder problems than would otherwise be possible solo.

### My Philosophy

I supervise AI tools the same way a lead engineer supervises a junior developer: I define the architecture, set the requirements, review every line, and make all the final calls. The AI handles the boilerplate, accelerates iteration, and lets me stay focused on product thinking. The result is a faster feedback loop without sacrificing ownership of the codebase.

I completed WGU's **Prompt Engineering** course in a single day — a reflection of how fluent I've become working across multiple frontier models including **Claude**, **Gemini**, and **Grok**. Knowing how each model reasons, where each one excels, and how to structure prompts for each is a real and valuable skill — one I apply directly in projects like this.

### The AI Stack for This Project

**Phase 1 — Architecture & Planning with Grok 4.20 Beta**

The project outline, technology selection, and initial architecture were developed using **Grok 4.20 beta** from [xAI](https://x.ai), accessed via the SuperGrok subscription. Grok 4.20 features a new rapid learning architecture with a **4-agent collaboration system** where agents debate and fact-check each other to reduce hallucinations — an approach that makes it particularly strong for high-level planning and tech decisions. (xAI has also announced a "Heavy" tier featuring 16 specialized agents for even more demanding tasks.)

**Phase 2 — Implementation & Iteration in Google Antigravity IDE**

The bulk of implementation, feature development, debugging, and refinement was done inside **[Google Antigravity IDE](https://antigravity.google)** using a combination of Google DeepMind and Anthropic's latest models:

- **Claude Sonnet 4.6** — Fast iteration, UI components, and routine feature work
- **Claude Opus 4.6** — Deeper reasoning for architecture decisions and complex state logic
- **Gemini 3.1 Pro** — Long-context reasoning and cross-file refactors
- **Gemini 3.1 Flash** — Rapid back-and-forth feedback loops and quick edits

Having access to multiple frontier models in a single IDE means I can route tasks to the right model for the job — the same way a senior engineer delegates to the right teammate.

---

## About

Built by **Alec Okelberry** — BSCS student at Western Governors University.

- GitHub: [@alecokelberry](https://github.com/alecokelberry)

---

## License

MIT
