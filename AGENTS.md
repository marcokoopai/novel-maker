# Repository Guidelines

## Project Structure & Module Organization

This repository is a Vite + React + TypeScript app for a novel-writing studio. Production source lives in `src/`: `App.tsx` coordinates the main UI, `components/` contains panels and modals, `hooks/` contains reusable React hooks, `lib/` contains data, theme, i18n, and AI helpers, and `types.ts` defines shared types. Global CSS is in `src/index.css`; the app entry is `src/main.tsx`.

The `project/` directory contains the exported design prototype and should be treated as reference material, not production code. `chats/` contains design handoff context. Root config files include `package.json`, `tsconfig.json`, `vite.config.ts`, and `.env.example`.

## Build, Test, and Development Commands

- `npm install` installs dependencies from `package-lock.json`.
- `npm run dev` starts the local Vite development server.
- `npm run build` runs TypeScript checking with `tsc` and builds the app with Vite.
- `npm run preview` serves the built app locally for a production-style smoke test.

## Coding Style & Naming Conventions

Use TypeScript and React function components. Follow the existing style: two-space indentation, single quotes, semicolon-free statements, and concise inline handlers where they remain readable. Name React components in `PascalCase` (`SettingsPanel.tsx`), hooks with `use` prefixes (`useSettings.ts`), and shared helpers with descriptive camelCase exports. Keep shared types in `src/types.ts` unless a type is tightly scoped to one component.

Prefer existing theme, translation, and data helpers from `src/lib/` before adding new constants. Keep UI copy routed through `src/lib/i18n.ts` when it is user-facing.

## Testing Guidelines

No automated test runner is currently configured. For now, validate changes with `npm run build` and manual checks in `npm run dev`. If adding tests, add the test framework and scripts in `package.json`, place tests near the code they cover or under a clear `src/__tests__/` directory, and use names such as `SettingsPanel.test.tsx`.

## Commit & Pull Request Guidelines

The current history uses concise Conventional Commit style, for example `feat: implement AI 小說工作室 as Vite + React + TypeScript app`. Use lowercase types such as `feat:`, `fix:`, `docs:`, or `chore:` followed by a clear imperative summary.

Pull requests should describe the user-facing change, mention validation performed (`npm run build`, manual browser checks), link related issues when available, and include screenshots or screen recordings for visible UI changes.

## Security & Configuration Tips

Copy `.env.example` to `.env` for local AI configuration. Never commit real API keys. Client-exposed variables must use the `VITE_` prefix, so treat them as public at runtime.
