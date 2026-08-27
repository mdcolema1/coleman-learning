# Coleman Family Learning Program v6.1

React + TypeScript + Vite version configured specifically for:

- GitHub owner: `mdcolema1`
- Repository: `colemankidsgames.github.io`
- Expected GitHub Pages URL: `https://mdcolema1.github.io/colemankidsgames.github.io/`

## Important deployment setting

In GitHub go to:

Settings → Pages → Build and deployment → Source → GitHub Actions

Do not use "Deploy from a branch" for this React/Vite version.

## Repository structure

Upload the contents of this ZIP directly to the repository root. The repository root should contain:

- `.github/`
- `public/`
- `src/`
- `index.html`
- `package.json`
- `tsconfig.app.json`
- `tsconfig.json`
- `tsconfig.node.json`
- `vite.config.ts`
- `README.md`

Do not upload the enclosing folder as a single nested directory.

## Publishing

1. Delete the old repository files.
2. Upload every file and folder from this package to the repository root.
3. Commit to the `main` branch.
4. Open Settings → Pages and choose GitHub Actions.
5. Open Actions and wait for `Build and Deploy Coleman Learning` to complete.
6. Open the deployment URL shown by GitHub.

## Blank-screen protection

This build uses the exact Vite base path `/colemankidsgames.github.io/` and includes a startup recovery message. If the JavaScript application cannot start, a visible recovery card should appear instead of a blank screen.

## iPad voices

The Parent Admin portal lists English voices available on the current device and prioritizes voices whose names indicate Natural, Neural, Premium, Enhanced, Samantha, Ava, Jenny, Aria, and similar higher-quality options. Voice quality still depends on what Safari/iPadOS exposes to web pages.

## Local data

GitHub Pages has no shared database. Learning data stays in browser storage on each device.
