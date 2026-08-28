# Task 2 Report: Shared Application Capability and Starter Tool

## Status

Complete. Added the stable `AppStatus` capability and the single read-only `get_app_status` WebMCP tool backed by that capability.

## Files

- `src/app/app-status.ts`
- `src/app/app-status.test.ts`
- `src/webmcp/tools.ts`
- `src/webmcp/tools.test.ts`

## Red/green evidence

- RED: `mise exec node@22.23.2 -- npm test -- src/app/app-status.test.ts` — failed during suite setup because `./app-status` did not exist.
- GREEN: same command after implementation — 1 test passed.
- RED: `mise exec node@22.23.2 -- npm test -- src/webmcp/tools.test.ts` — failed during suite setup because `./tools` did not exist.
- GREEN/focused: `mise exec node@22.23.2 -- npm test -- src/app/app-status.test.ts src/webmcp/tools.test.ts` — 2 files and 4 tests passed.

Additional verification:

- `mise exec node@22.23.2 -- npm run build` — TypeScript check and Vite production build passed.
- `mise exec node@22.23.2 -- npm run lint` — passed with no ESLint output.
- `git diff --check` — passed.
- `npm run format:check` was initially blocked by formatting in pre-existing files and the new files; the four new files were formatted individually. Full repository format check remains affected by pre-existing `.superpowers`, `docs`, and `README.md` formatting warnings.

## Self-review

- `AppStatus` uses literal types matching the requested stable contract.
- The tool schema is an empty object with `additionalProperties: false` and a read-only annotation.
- Runtime validation rejects unexpected input with the required error message.
- The tool delegates to `getAppStatus()` and is the sole entry in the readonly `webMcpTools` array.
- No unrelated files were modified.

## Concerns

Full-repository Prettier check still reports pre-existing formatting issues in `.superpowers/sdd/2026-08-28-webmcp-foundation/task-2-brief.md`, `docs/superpowers/plans/2026-08-28-webmcp-foundation.md`, and `README.md`.

## Commit

`2f4bc16 feat: define WebMCP status tool`
