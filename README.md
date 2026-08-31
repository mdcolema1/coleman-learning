# Coleman Family Learning Adventure v11

Version 11 makes the approved HTML5/Phaser Ocean Expedition design the primary child-facing experience.

## Child experience
- Choose an explorer, then enter directly into the full-screen World 1 expedition.
- No Adventure Hub, World Map, or Worlds 2–10 selector is exposed in the child flow.
- The animated Phaser ocean scene fills the display while mission, explorer, energy, currency, discovery, treasure, and mastery information appears as a game HUD.
- Learning, Aquarium, Store, Journal, Cabin, Knowledge Bank, Skill Tree, and Settings are launched from the in-game dock.
- Learning continues to power Adventure Energy, XP, pearls, mastery, and region progression.

## Learning and safety systems retained
The v8–v10 adaptive learning engine, allowance logic, mastery tracking, answer-leak protections, 107,100-question audit, Parent Admin, local saves, offline support, and gated World 1 progression remain intact.

## Deployment
GitHub Pages builds with React + TypeScript + Vite + Phaser. Run `npm run verify` and `npm run build`; the included GitHub Actions workflow performs validation and deployment.
