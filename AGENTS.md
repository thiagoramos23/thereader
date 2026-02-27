# AGENTS.md

Project-level guidance for human and AI agents working in this repository.

## 1. Mission and Scope

- Build and maintain a Tailwind-first RSS/article reader with a Tauri-ready architecture.
- Keep implementation pragmatic: stable contracts, small changes, strong verification.

## 2. Repository Map

- `apps/web`: React + Vite + Tailwind UI.
- `apps/api`: Express + SQLite ingestion/search API.
- `packages/core`: Shared domain types/contracts/helpers.

When in doubt:

- UI behavior and presentation live in `apps/web`.
- HTTP transport and persistence live in `apps/api`.
- Cross-app contracts and pure logic live in `packages/core`.

## 3. Architecture Rules (Important)

- Keep `packages/core` framework-agnostic:
  - No React, Express, or database driver imports.
  - Prefer pure functions and typed interfaces.
- Frontend must use `ContentGateway` abstraction.
  - Do not scatter direct API fetch logic in feature components.
- API should act as adapter/orchestrator:
  - Parse/validate input, call services/repositories, return typed payloads.
- Preserve Tauri migration path:
  - Keep DTO shapes stable.
  - Avoid coupling UI components to HTTP details.

## 4. Coding Standards

- TypeScript strict mode only.
- No `any`; use `unknown` with type guards when needed.
- Use `import type` for type-only imports.
- Use `node:` prefix for built-in Node modules.
- Prefer `const`; avoid `var`.
- Keep functions small and composable; favor explicit names over clever code.

## 5. Frontend Standards

- Tailwind is the primary styling system.
- Reuse design tokens from `apps/web/src/styles/tokens.css`.
- Maintain responsive behavior:
  - Mobile `<768`: single-pane list/detail routes.
  - Tablet `768-1279`: one pane at a time with drawer.
  - Desktop `>=1280`: rail + list + detail panes.
- Keep interaction states explicit: loading, empty, error, success.

## 6. API and Data Standards

- Validate external input at route boundaries.
- Sanitize extracted HTML before storing/rendering.
- Keep duplicate handling as canonical URL upsert.
- Preserve search behavior:
  - Multi-term AND matching.
  - Relevance-first sorting, then recency.
- Add SQL migrations for schema changes; do not edit production schema ad hoc.

## 7. Testing and Verification

- Add or update tests for every behavior change.
- Prefer test-first for bug fixes and new logic.
- Run targeted tests while iterating, then full checks before finalizing:
  - `npm run lint`
  - `npm run test`
  - `npm run build`
- For responsive UI changes, also run:
  - `npm run test:e2e -w apps/web`

## 8. Workflow and Commits

- Keep changes focused; avoid unrelated refactors.
- Use conventional commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`).
- Commit messages should explain why, not only what.

## 9. Dependency and Runtime Notes

- Native module in use: `better-sqlite3`.
- If Node version changes and native ABI errors appear, run:
  - `npm run rebuild:native`

## 10. Done Checklist

- Behavior implemented and verified locally.
- Tests updated and passing.
- Lint/build passing.
- Architecture boundaries respected (`web`/`api`/`core`).
- No sensitive data or credentials committed.

## Agent Orchestrator (ao) Session

You are running inside an Agent Orchestrator managed workspace.
Session metadata is updated automatically via shell wrappers.

If automatic updates fail, you can manually update metadata:
```bash
~/.ao/bin/ao-metadata-helper.sh  # sourced automatically
# Then call: update_ao_metadata <key> <value>
```
