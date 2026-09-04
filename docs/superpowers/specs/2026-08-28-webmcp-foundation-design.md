# WebMCP Application Foundation Design

**Date:** 2026-08-28

## Objective

Create a small, production-minded client-side foundation for the OpenAI WebMCP Challenge. The foundation must be ready to receive the Figma prototype without inventing the product experience in advance, and it must demonstrate a real, testable WebMCP registration path.

## Scope

This phase includes:

- A React single-page application built with Vite and TypeScript.
- A neutral, responsive placeholder screen that can be replaced from the Figma handoff.
- A framework-independent WebMCP adapter and tool registry.
- One read-only `get_app_status` starter tool that verifies the integration without pretending to implement the future product.
- Automated tests, linting, formatting checks, build verification, documentation, and an open-source license.

This phase excludes authentication, backend APIs, persistence, analytics, deployment configuration, product-specific workflows, a component library, and visual design beyond a usable placeholder.

## Stack Decision

Use React with Vite rather than Next.js.

WebMCP tools are registered through the browser's top-level `document.modelContext` API. The current phase is intentionally client-only, so Next.js would introduce server/client boundaries and deployment assumptions without providing a needed capability. Vite keeps the runtime model direct, makes WebMCP registration easy to reason about, and remains compatible with any static hosting provider allowed by the challenge.

Use:

- React and TypeScript for the application.
- Vite for development and production builds.
- Vitest and Testing Library for behavior tests.
- ESLint for static analysis and Prettier for deterministic formatting.
- The maintained `webmcp-types` package for WebMCP type declarations.
- Plain CSS with design tokens expressed as custom properties, leaving the future Figma implementation unconstrained.

The project will declare a supported Node.js version in `package.json` and document it in the README. Dependency versions will be locked in the generated lockfile.

## Architecture

The codebase will have four boundaries:

1. **Application shell** — mounts React, supplies global styling, and renders a small placeholder page.
2. **Application capabilities** — plain TypeScript functions that represent actions or queries available to both the human interface and agents.
3. **WebMCP adapter** — detects browser support, registers definitions, handles cleanup, and converts registration failures into observable non-fatal status.
4. **Tool definitions** — narrow schemas and handlers that call application capabilities and return structured, verifiable results.

The UI must not call `document.modelContext` directly. Tool handlers must not duplicate UI behavior. Both entry points call the same capability functions so future product behavior stays consistent.

Proposed source layout:

```text
src/
  app/
    App.tsx
    app-status.ts
  webmcp/
    register-tools.ts
    tools.ts
    types.ts
  test/
    setup.ts
  main.tsx
  styles.css
```

Tests will live beside the unit they exercise where practical.

## WebMCP Lifecycle

On application mount, React calls the WebMCP registration adapter. The adapter checks that `document.modelContext.registerTool` exists before doing any work.

When supported, the adapter creates one `AbortController`, registers each tool with its signal, and reports a supported/registered state to the UI. Cleanup aborts that controller, unregistering the tools. This makes the integration safe across navigation, hot reload, and React Strict Mode's development mount cycle.

When unsupported, the adapter returns an unsupported state and the application remains usable. WebMCP is progressive enhancement, not an application boot requirement.

The initial `get_app_status` tool:

- Accepts no properties and rejects additional properties in its JSON Schema.
- Is marked read-only.
- Returns a small structured object describing the application name, foundation phase, and WebMCP readiness.
- Has no network, storage, or UI side effects.

Future product tools will be added to the registry only after the corresponding human-facing capability exists.

## Data and Control Flow

```text
Human UI ───────┐
                ├─> application capability ─> state/UI result
WebMCP handler ─┘                         └─> structured tool result
```

Tool inputs are untrusted. JSON Schema narrows what the browser should send, while handlers still validate assumptions before calling application capabilities. Read and write intent will be made explicit through WebMCP annotations. Results will include enough information for an agent or human reviewer to verify what happened.

## Error Handling

- Missing WebMCP support is a normal capability state, not an exception.
- Registration rejection is caught and exposed as a non-blocking error state; it does not crash the React tree.
- Tool execution errors use clear, non-sensitive messages and preserve the underlying application state.
- No fallback or polyfill will pretend to provide native WebMCP support.
- Browser console output will not include secrets, user data, or noisy expected errors.

## Placeholder Experience

The initial screen will contain only:

- The repository/app name.
- A short statement that the WebMCP foundation is ready for the Figma handoff.
- A compact WebMCP capability indicator with supported, unsupported, and registration-error states.
- Brief local testing guidance.

The markup will be semantic, keyboard-safe, responsive, and respect reduced-motion and color-scheme preferences. Styling will stay intentionally neutral so it can be replaced rather than untangled.

## Testing and Verification

Automated tests will verify:

- The application renders without WebMCP support.
- The adapter registers the starter tool when support exists.
- The starter tool returns the expected structured status.
- Cleanup aborts the registration signal.
- Registration rejection is contained and reported without crashing the app.

The completion gate is a fresh successful run of:

- Unit and component tests.
- ESLint.
- Prettier check.
- TypeScript compilation through the production build.

A manual verification checklist will explain how to inspect the tool in ChatGPT's in-app browser and Chrome with WebMCP testing enabled. Native WebMCP discovery cannot be truthfully claimed from the ordinary Vitest DOM environment, so the README will distinguish automated adapter coverage from browser integration testing.

## Repository and Challenge Readiness

The README will include prerequisites, local commands, the architecture boundary, how to add a capability and corresponding tool, supported-browser behavior, and challenge testing instructions. An MIT `LICENSE` file will satisfy the challenge's open-source repository requirement.

Deployment remains provider-neutral. A deployment configuration can be added after the product flow and preferred host are known.

## Success Criteria

The foundation is complete when:

1. A clean checkout can install, test, lint, format-check, and build using documented commands.
2. The app works in a browser without WebMCP support.
3. A compatible top-level browser page registers exactly one read-only `get_app_status` tool.
4. Tool registration is cleaned up when the React integration unmounts.
5. The repository contains clear extension instructions and an MIT license.
6. No product-specific behavior or visual system has been invented ahead of the Figma handoff.
