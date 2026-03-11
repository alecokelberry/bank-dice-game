# BANK! Dice Game

A browser-based multiplayer dice game built with **Next.js 16**, **TypeScript**, and **Zustand**. Players share a communal bank that grows with each dice roll, deciding when to cash out before someone rolls a 7 and busts everything.

**[Play it live on Vercel](https://bank-dice-game.vercel.app)**

---

## Inspiration

This game is a digital adaptation of **BANK!**, a physical dice game published by [Thunder Hive Games](https://www.thunderhivegames.com). If you enjoy the app, check out the original — they make great tabletop games.

---

## How to Play

### The Basics

1. **Setup** — Add 2–8 players (or AI Ghosts), choose a round count, and optionally enable Round Events.
2. **Safe Zone** (rolls 1–3 by default) — Every roll adds its sum to the shared bank. Rolling a **7 is lucky and adds +70 pts**.
3. **Danger Zone** (roll 4+) — Rolling **doubles multiplies the bank 2×**. Rolling a **7 busts** the bank and everyone still in loses everything.
4. **Bank** anytime after roll 1 to lock in your share of the current bank value as score.
5. The round ends when all players bank or a bust occurs.
6. **Highest score after all rounds wins.**

### Banking & Scoring

- Banking gives you the **current bank total** as points.
- **Streak bonuses**: +25 pts for 3 consecutive banks across rounds; +50 pts for 5+ consecutive banks.
- Players who bust or fail to bank in time score **0 for that round**.

### Controls

| Input              | Action                                                     |
| ------------------ | ---------------------------------------------------------- |
| Sum buttons (2–11) | Enter the sum of the two dice you rolled                   |
| **12 button**      | Enter a 12 (safe zone only — doubles button replaces it in danger zone) |
| **Doubles button** | Enter a doubles roll (danger zone only)                    |
| `Space` / `R`      | Roll the built-in virtual dice                             |
| `D`                | Submit doubles                                             |
| `B`                | Bank the first unbanked player                             |
| `1`–`9`            | Bank a specific player by position                         |
| `U`                | Undo the last action                                       |

---

## Round Events

When enabled, a random event is picked at the start of each round to shake up the rules:

| Event               | Effect                                                                                  |
| ------------------- | --------------------------------------------------------------------------------------- |
| **Triple Threat**   | Doubles multiply the bank by **3×** instead of 2×.                                     |
| **Extended Safety** | The safe zone lasts for **5 rolls** instead of 3. More room to build the bank.         |
| **Ghost Overdrive** | Every Ghost takes **two turns** this round instead of one.                              |
| **Heavenly Sevens** | Safe-zone 7s give **+140** to the bank instead of +70.                                 |
| **Devil's Mercy**   | The **first danger-zone 7** adds 7 to the bank rather than busting it.                 |
| **Short Fuse**      | The safe zone lasts only **1 roll**. Danger hits immediately.                           |
| **Golden Totals**   | Any roll totaling **10, 11, or 12** counts as doubles in the danger zone.               |
| **Resilient Bank**  | The **first danger-zone 7** only **halves** the bank instead of wiping it.              |
| **Time Bomb**       | A hidden roll between 4 and 10 is rigged to bust. Nobody knows which one until it hits. |

> Events do not stack — there is only ever **one** active event per round.
---

## AI Ghost Players

Ghosts are automated opponents that follow a fixed aggressive strategy:

- **In the safe zone**: Ghosts always roll a 7 (maximizing the bank for everyone).
- **In the danger zone**: Ghosts always roll doubles (multiplying the bank, then banking).
- Ghosts can be limited to a configurable number of early rounds, or left active for the entire game.
- Ghost Overdrive round event gives them two turns per round instead of one.

---

## Features

- **2–8 players** with custom names, assigned colors, and configurable turn order
- **AI Ghost Players** with aggressive bank-building strategy
- **Live Leaderboards** — track rankings in real-time during gameplay
- **9 Round Events** — random rule modifiers that keep every round unpredictable
- **Interactive Event Badges** — dynamic, clickable badges that change color and icon based on the active event
- **Configurable round count** — 10, 15, or 20 rounds
- **Dual input modes** — tap sum buttons for physical dice, or use the built-in virtual roller
- **Banking streak bonus** — +25 pts for 3 consecutive banks, +50 pts for 5+
- **Snapshot-based undo** — full state rewind for the last roll or bank action
- **Synthesized sound effects** — all audio generated via Web Audio API (zero external files)
- **Haptic feedback** — vibration on mobile for rolls, banks, and busts
- **State persistence** — game state survives page refreshes via `localStorage`
- **Modern, Responsive UI** — mobile-first layout with glassmorphism, animated gradients, and seamless light/dark mode support
- **Between-round summaries** — ranked standings with banked/bust status shown after each round
- **Mid-game settings** — edit player names and options without restarting

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout with metadata and viewport config
│   ├── page.tsx                # Phase-based game router (setup → playing → finished)
│   └── globals.css             # Tailwind imports and global styles
├── components/
│   ├── ui/
│   │   ├── button.tsx          # Reusable button with variant/size props
│   │   └── dialog.tsx          # Animated modal dialog component
│   ├── bank-display.tsx        # Animated bank counter with dynamic round event badges and danger-zone glow
│   ├── bust-overlay.tsx        # Full-screen bust notification with screen shake
│   ├── dice.tsx                # SVG dice faces with rolling animation
│   ├── player-list.tsx         # Player sidebar with bank buttons, turn indicators, and leader crowns
│   ├── roll-controls.tsx       # Sum input grid and keyboard shortcut handler
│   ├── round-summary.tsx       # Between-round standings overlay
│   ├── settings-dialog.tsx     # Mid-game settings editor
│   ├── setup-screen.tsx        # High-polish, glassmorphic pre-game player and rules configuration
│   ├── top-bar.tsx             # Responsive nav bar with undo, virtual dice, and customizable light/dark themes
│   └── winner-screen.tsx       # End-game leaderboard with confetti
├── lib/
│   ├── sounds.ts               # Web Audio API synthesized sounds and haptic feedback
│   └── utils.ts                # Tailwind class merge utility
└── store/
    └── game-store.ts           # Zustand store: all game state, types, logic, and selectors
```

---

## Architecture

**Centralized state** — All game logic lives in a single Zustand store (`game-store.ts`). Components are pure consumers that read via selectors and dispatch named actions. This makes the data flow predictable and keeps components thin.

**Persist middleware** — The store serializes to `localStorage` via Zustand's `persist` middleware with `partialize` — only the fields that matter for game continuity are stored. The storage key is versioned to prevent stale data from breaking the app after updates.

**Static export** — Built as a fully static site (`output: "export"` in `next.config.ts`). No server, no cold starts — deployable to any CDN.

**Snapshot undo** — Before every roll or bank action, the full game state is captured in an `undoSnapshot`. Undo is a single atomic state swap, guaranteeing consistency across all fields.

**Phase-based router** — The main page renders the correct screen based on `phase: "setup" | "playing" | "round_summary" | "finished"`. Overlays (`BustOverlay`, `RoundSummary`) layer on top via fixed positioning.

**Turn order** — `getTurnOrder()` computes the live turn rotation accounting for Ghost Overdrive (ghosts appear twice), banked players (skipped), and inactive ghosts. `advanceRollerIndex()` advances past any players who should be skipped.

---

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev       # http://localhost:3000

# Build for production (static export → /out)
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
