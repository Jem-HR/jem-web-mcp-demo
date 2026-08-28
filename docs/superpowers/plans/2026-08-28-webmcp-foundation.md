# WebMCP Application Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a tested React/Vite foundation that progressively registers one read-only WebMCP tool and is ready for the upcoming Figma implementation.

**Architecture:** UI and WebMCP handlers share plain TypeScript application capabilities. A framework-independent registration adapter owns feature detection, registration, failure containment, and abort-based cleanup; a small React hook binds that lifecycle to the placeholder shell.

**Tech Stack:** React 19.2.8, TypeScript 7.0.2, Vite 8.2.2, Vitest 4.1.11, Testing Library 16.3.3, ESLint 10.9.1, Prettier 3.9.6, and `webmcp-types` 0.1.5.

**Spec:** `docs/superpowers/specs/2026-08-28-webmcp-foundation-design.md`

## Global Constraints

- This phase is client-only: no authentication, backend API, persistence, analytics, or deployment configuration.
- Use React with Vite and TypeScript; do not add Next.js, Tailwind, or a component library.
- WebMCP is progressive enhancement: the human interface must work when `document.modelContext` is absent.
- Register imperative tools only from the top-level page; do not add declarative form tools or iframe registrations.
- UI actions and WebMCP tools must call shared application capabilities rather than duplicate behavior.
- The only starter tool is the read-only `get_app_status` tool.
- Styling must remain neutral, responsive, semantic, keyboard-safe, and compatible with reduced-motion and color-scheme preferences.
- Use Node.js 20.19.0 or newer. The local execution command is `mise exec node@20.19.2 -- npm` because the default shell currently selects Node.js 20.18.1.
- Pin dependency versions exactly and commit `package-lock.json`.
- Follow red-green-refactor for every behavior change and commit after every task.

---

## File Map

- `.gitignore` — excludes dependencies, builds, coverage, environment overrides, and local editor artifacts.
- `.prettierignore` — excludes generated outputs from formatting checks.
- `package.json` / `package-lock.json` — exact toolchain, scripts, and Node.js engine requirement.
- `eslint.config.js` — flat ESLint configuration for TypeScript and React.
- `tsconfig.json` — strict browser TypeScript configuration with WebMCP ambient declarations.
- `vite.config.ts` — React and Vitest/jsdom configuration.
- `index.html` — Vite HTML entry point.
- `src/main.tsx` — React root mount.
- `src/styles.css` — neutral placeholder styling and design tokens.
- `src/test/setup.ts` — DOM matcher registration and per-test cleanup.
- `src/app/app-status.ts` — framework-independent application status capability.
- `src/app/App.tsx` — semantic placeholder interface and WebMCP status presentation.
- `src/app/App.test.tsx` — placeholder and integration-state component tests.
- `src/webmcp/tools.ts` — WebMCP tool definitions backed by application capabilities.
- `src/webmcp/tools.test.ts` — schema, annotation, validation, and execution tests.
- `src/webmcp/types.ts` — registration status union shared by adapter and UI.
- `src/webmcp/register-tools.ts` — feature detection, registration, failure handling, and cleanup.
- `src/webmcp/register-tools.test.ts` — adapter lifecycle tests using a fake model context.
- `src/webmcp/use-webmcp-status.ts` — React lifecycle binding for the adapter.
- `README.md` — setup, architecture, extension, and manual WebMCP testing instructions.
- `LICENSE` — MIT license required by the challenge submission.

---

### Task 1: Bootstrap the Tested React/Vite Shell

**Files:**
- Create: `.gitignore`
- Create: `.prettierignore`
- Create: `package.json`
- Create: `package-lock.json` through `npm install`
- Create: `eslint.config.js`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/test/setup.ts`
- Create: `src/app/App.test.tsx`
- Create: `src/app/App.tsx`
- Create: `src/main.tsx`
- Create: `src/styles.css`

**Interfaces:**
- Consumes: the approved design spec only.
- Produces: `App(): JSX.Element`, the test/build toolchain, and the global stylesheet imported by `src/main.tsx`.

- [ ] **Step 1: Create the toolchain manifests and configuration**

Create `package.json`:

```json
{
  "name": "jem-web-mcp-demo",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "engines": {
    "node": ">=20.19.0"
  },
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint .",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "check": "npm run test && npm run lint && npm run format:check && npm run build"
  },
  "dependencies": {
    "react": "19.2.8",
    "react-dom": "19.2.8"
  },
  "devDependencies": {
    "@eslint/js": "10.0.1",
    "@testing-library/jest-dom": "7.0.1",
    "@testing-library/react": "16.3.3",
    "@types/react": "19.2.18",
    "@types/react-dom": "19.2.5",
    "@vitejs/plugin-react": "6.1.1",
    "eslint": "10.9.1",
    "eslint-plugin-react-hooks": "7.1.1",
    "eslint-plugin-react-refresh": "0.5.5",
    "globals": "17.11.0",
    "jsdom": "30.0.1",
    "prettier": "3.9.6",
    "typescript": "7.0.2",
    "typescript-eslint": "8.68.0",
    "vite": "8.2.2",
    "vitest": "4.1.11",
    "webmcp-types": "0.1.5"
  }
}
```

Create `.gitignore`:

```gitignore
node_modules/
dist/
coverage/
.env
.env.*
!.env.example
.DS_Store
*.local
```

Create `.prettierignore`:

```text
node_modules
dist
coverage
package-lock.json
```

Create `eslint.config.js`:

```js
import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
  globalIgnores(['dist', 'coverage']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2024,
      globals: globals.browser,
    },
  },
])
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "allowImportingTsExtensions": false,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true,
    "skipLibCheck": true,
    "types": ["vite/client", "webmcp-types"]
  },
  "include": ["src", "vite.config.ts"]
}
```

Create `vite.config.ts`:

```ts
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
  },
})
```

Create `index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta
      name="description"
      content="A client-side foundation for the OpenAI WebMCP Challenge."
    />
    <title>Jem WebMCP Demo</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Create `src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})
```

- [ ] **Step 2: Install the exact dependencies and generate the lockfile**

Run:

```bash
mise exec node@20.19.2 -- npm install
```

Expected: exit 0, `package-lock.json` is created, and npm reports no engine mismatch.

- [ ] **Step 3: Write the failing shell test**

Create `src/app/App.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { App } from './App'

describe('App', () => {
  it('renders the neutral WebMCP foundation shell', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { name: 'Jem WebMCP Demo' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Ready for the Figma handoff.'),
    ).toBeInTheDocument()
  })
})
```

- [ ] **Step 4: Run the test and verify the red state**

Run:

```bash
mise exec node@20.19.2 -- npm test -- src/app/App.test.tsx
```

Expected: FAIL because `src/app/App.tsx` does not exist.

- [ ] **Step 5: Implement the smallest shell that passes**

Create `src/app/App.tsx`:

```tsx
export function App() {
  return (
    <main className="app-shell">
      <section className="app-card" aria-labelledby="app-title">
        <p className="eyebrow">OpenAI WebMCP Challenge</p>
        <h1 id="app-title">Jem WebMCP Demo</h1>
        <p className="lede">Ready for the Figma handoff.</p>
      </section>
    </main>
  )
}
```

Create `src/main.tsx`:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './app/App'
import './styles.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element not found.')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

Create `src/styles.css`:

```css
:root {
  color-scheme: light dark;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  --page: #f5f5f2;
  --surface: #ffffff;
  --text: #181816;
  --muted: #686863;
  --border: #deded8;
  --accent: #176b52;
  --accent-soft: #e4f2ec;
  --error: #a83a32;
  --error-soft: #f9e8e5;
}

* {
  box-sizing: border-box;
}

body {
  min-width: 320px;
  min-height: 100vh;
  margin: 0;
  background: var(--page);
  color: var(--text);
}

button,
input,
textarea,
select {
  font: inherit;
}

.app-shell {
  display: grid;
  min-height: 100vh;
  place-items: center;
  padding: clamp(1rem, 4vw, 3rem);
}

.app-card {
  width: min(100%, 44rem);
  padding: clamp(1.5rem, 5vw, 3.5rem);
  border: 1px solid var(--border);
  border-radius: 1.5rem;
  background: var(--surface);
  box-shadow: 0 1.5rem 4rem rgb(20 20 18 / 8%);
}

.eyebrow {
  margin: 0 0 0.75rem;
  color: var(--accent);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  font-size: clamp(2rem, 8vw, 4.5rem);
  letter-spacing: -0.05em;
  line-height: 0.98;
}

.lede {
  max-width: 34rem;
  margin: 1.25rem 0 0;
  color: var(--muted);
  font-size: clamp(1rem, 2vw, 1.2rem);
  line-height: 1.6;
}

@media (prefers-color-scheme: dark) {
  :root {
    --page: #151513;
    --surface: #20201d;
    --text: #f2f2ed;
    --muted: #b4b4ac;
    --border: #383833;
    --accent: #75c9aa;
    --accent-soft: #183d31;
    --error: #ffaba3;
    --error-soft: #4b2522;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 6: Verify the shell test passes**

Run:

```bash
mise exec node@20.19.2 -- npm test -- src/app/App.test.tsx
```

Expected: PASS with 1 test.

- [ ] **Step 7: Commit the bootstrapped shell**

```bash
git add .gitignore .prettierignore package.json package-lock.json eslint.config.js tsconfig.json vite.config.ts index.html src
git commit -m "chore: bootstrap React WebMCP app"
```

---

### Task 2: Define the Shared Application Capability and Starter Tool

**Files:**
- Create: `src/app/app-status.test.ts`
- Create: `src/app/app-status.ts`
- Create: `src/webmcp/tools.test.ts`
- Create: `src/webmcp/tools.ts`

**Interfaces:**
- Consumes: ambient `WebMCP.ModelContextTool` declarations from `webmcp-types`.
- Produces: `AppStatus`, `getAppStatus(): AppStatus`, `getAppStatusTool: WebMCP.ModelContextTool`, and `webMcpTools: readonly WebMCP.ModelContextTool[]`.

- [ ] **Step 1: Write the failing application-capability test**

Create `src/app/app-status.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { getAppStatus } from './app-status'

describe('getAppStatus', () => {
  it('returns the stable foundation status shared by humans and agents', () => {
    expect(getAppStatus()).toEqual({
      name: 'Jem WebMCP Demo',
      phase: 'foundation',
      webMcpReady: true,
    })
  })
})
```

- [ ] **Step 2: Run the capability test and verify the red state**

Run:

```bash
mise exec node@20.19.2 -- npm test -- src/app/app-status.test.ts
```

Expected: FAIL because `src/app/app-status.ts` does not exist.

- [ ] **Step 3: Implement the application capability**

Create `src/app/app-status.ts`:

```ts
export interface AppStatus {
  name: 'Jem WebMCP Demo'
  phase: 'foundation'
  webMcpReady: true
}

export function getAppStatus(): AppStatus {
  return {
    name: 'Jem WebMCP Demo',
    phase: 'foundation',
    webMcpReady: true,
  }
}
```

- [ ] **Step 4: Verify the capability test passes**

Run:

```bash
mise exec node@20.19.2 -- npm test -- src/app/app-status.test.ts
```

Expected: PASS with 1 test.

- [ ] **Step 5: Write the failing starter-tool tests**

Create `src/webmcp/tools.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { getAppStatusTool, webMcpTools } from './tools'

describe('getAppStatusTool', () => {
  it('declares a narrow read-only tool schema', () => {
    expect(getAppStatusTool).toMatchObject({
      name: 'get_app_status',
      annotations: { readOnlyHint: true },
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
    })
    expect(webMcpTools).toEqual([getAppStatusTool])
  })

  it('returns structured, verifiable application status', async () => {
    await expect(getAppStatusTool.execute({})).resolves.toEqual({
      name: 'Jem WebMCP Demo',
      phase: 'foundation',
      webMcpReady: true,
    })
  })

  it('rejects unexpected input even when the caller bypasses the schema', async () => {
    await expect(
      getAppStatusTool.execute({ unexpected: true }),
    ).rejects.toThrow('get_app_status does not accept input properties.')
  })
})
```

- [ ] **Step 6: Run the tool tests and verify the red state**

Run:

```bash
mise exec node@20.19.2 -- npm test -- src/webmcp/tools.test.ts
```

Expected: FAIL because `src/webmcp/tools.ts` does not exist.

- [ ] **Step 7: Implement the starter tool using the shared capability**

Create `src/webmcp/tools.ts`:

```ts
import { getAppStatus } from '../app/app-status'

export const getAppStatusTool = {
  name: 'get_app_status',
  title: 'Get application status',
  description:
    'Read the current foundation status of the Jem WebMCP Demo without changing application state.',
  inputSchema: {
    type: 'object',
    properties: {},
    additionalProperties: false,
  },
  annotations: {
    readOnlyHint: true,
  },
  async execute(input) {
    if (Object.keys(input).length > 0) {
      throw new TypeError('get_app_status does not accept input properties.')
    }

    return getAppStatus()
  },
} satisfies WebMCP.ModelContextTool

export const webMcpTools: readonly WebMCP.ModelContextTool[] = [
  getAppStatusTool,
]
```

- [ ] **Step 8: Verify all capability and tool tests pass**

Run:

```bash
mise exec node@20.19.2 -- npm test -- src/app/app-status.test.ts src/webmcp/tools.test.ts
```

Expected: PASS with 4 tests.

- [ ] **Step 9: Commit the shared capability and starter tool**

```bash
git add src/app/app-status.ts src/app/app-status.test.ts src/webmcp/tools.ts src/webmcp/tools.test.ts
git commit -m "feat: define WebMCP status tool"
```

---

### Task 3: Register Tools with Feature Detection and Abort Cleanup

**Files:**
- Create: `src/webmcp/types.ts`
- Create: `src/webmcp/register-tools.test.ts`
- Create: `src/webmcp/register-tools.ts`

**Interfaces:**
- Consumes: `webMcpTools: readonly WebMCP.ModelContextTool[]` from Task 2.
- Produces: `WebMcpStatus` and `registerWebMcpTools(modelContext, onStatus, tools?): () => void`.

- [ ] **Step 1: Define the registration status union**

Create `src/webmcp/types.ts`:

```ts
export type WebMcpStatus =
  | { state: 'registering' }
  | { state: 'ready'; toolCount: number }
  | { state: 'unsupported' }
  | { state: 'error'; message: string }
```

- [ ] **Step 2: Write the failing registration lifecycle tests**

Create `src/webmcp/register-tools.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest'

import { registerWebMcpTools } from './register-tools'
import { webMcpTools } from './tools'

function createModelContext(
  registerTool: WebMCP.ModelContext['registerTool'],
): WebMCP.ModelContext {
  return { registerTool } as WebMCP.ModelContext
}

describe('registerWebMcpTools', () => {
  it('reports unsupported without attempting registration', () => {
    const onStatus = vi.fn()

    const dispose = registerWebMcpTools(undefined, onStatus)

    expect(onStatus).toHaveBeenCalledOnce()
    expect(onStatus).toHaveBeenCalledWith({ state: 'unsupported' })
    expect(() => dispose()).not.toThrow()
  })

  it('registers every tool and reports readiness', async () => {
    const registerTool = vi.fn<WebMCP.ModelContext['registerTool']>()
    registerTool.mockResolvedValue(undefined)
    const onStatus = vi.fn()

    registerWebMcpTools(createModelContext(registerTool), onStatus)

    expect(onStatus).toHaveBeenNthCalledWith(1, { state: 'registering' })
    await vi.waitFor(() => {
      expect(onStatus).toHaveBeenLastCalledWith({
        state: 'ready',
        toolCount: webMcpTools.length,
      })
    })
    expect(registerTool).toHaveBeenCalledTimes(webMcpTools.length)
  })

  it('aborts the shared registration signal during cleanup', () => {
    const registerTool = vi.fn<WebMCP.ModelContext['registerTool']>()
    registerTool.mockResolvedValue(undefined)
    const onStatus = vi.fn()

    const dispose = registerWebMcpTools(
      createModelContext(registerTool),
      onStatus,
    )
    const options = registerTool.mock.calls[0]?.[1]

    expect(options?.signal?.aborted).toBe(false)
    dispose()
    expect(options?.signal?.aborted).toBe(true)
  })

  it('contains registration failures behind a non-sensitive status', async () => {
    const registerTool = vi.fn<WebMCP.ModelContext['registerTool']>()
    registerTool.mockRejectedValue(new Error('browser-internal details'))
    const onStatus = vi.fn()

    registerWebMcpTools(createModelContext(registerTool), onStatus)

    await vi.waitFor(() => {
      expect(onStatus).toHaveBeenLastCalledWith({
        state: 'error',
        message: 'WebMCP tool registration failed.',
      })
    })
  })
})
```

- [ ] **Step 3: Run the adapter tests and verify the red state**

Run:

```bash
mise exec node@20.19.2 -- npm test -- src/webmcp/register-tools.test.ts
```

Expected: FAIL because `src/webmcp/register-tools.ts` does not exist.

- [ ] **Step 4: Implement progressive registration and cleanup**

Create `src/webmcp/register-tools.ts`:

```ts
import { webMcpTools } from './tools'
import type { WebMcpStatus } from './types'

type StatusListener = (status: WebMcpStatus) => void

const REGISTRATION_ERROR = 'WebMCP tool registration failed.'

export function registerWebMcpTools(
  modelContext: WebMCP.ModelContext | undefined,
  onStatus: StatusListener,
  tools: readonly WebMCP.ModelContextTool[] = webMcpTools,
): () => void {
  if (!modelContext) {
    onStatus({ state: 'unsupported' })
    return () => undefined
  }

  const controller = new AbortController()
  onStatus({ state: 'registering' })

  let registrations: Promise<void>[]

  try {
    registrations = tools.map((tool) =>
      modelContext.registerTool(tool, { signal: controller.signal }),
    )
  } catch {
    onStatus({ state: 'error', message: REGISTRATION_ERROR })
    return () => controller.abort()
  }

  void Promise.all(registrations)
    .then(() => {
      if (!controller.signal.aborted) {
        onStatus({ state: 'ready', toolCount: tools.length })
      }
    })
    .catch(() => {
      if (!controller.signal.aborted) {
        onStatus({ state: 'error', message: REGISTRATION_ERROR })
      }
    })

  return () => controller.abort()
}
```

- [ ] **Step 5: Verify adapter and tool tests pass**

Run:

```bash
mise exec node@20.19.2 -- npm test -- src/webmcp/register-tools.test.ts src/webmcp/tools.test.ts
```

Expected: PASS with 7 tests.

- [ ] **Step 6: Commit the WebMCP lifecycle adapter**

```bash
git add src/webmcp/types.ts src/webmcp/register-tools.ts src/webmcp/register-tools.test.ts
git commit -m "feat: register WebMCP tools safely"
```

---

### Task 4: Bind WebMCP Status to the Accessible Placeholder UI

**Files:**
- Create: `src/webmcp/use-webmcp-status.ts`
- Modify: `src/app/App.test.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `registerWebMcpTools(document.modelContext, onStatus)` and `WebMcpStatus` from Task 3.
- Produces: `useWebMcpStatus(): WebMcpStatus` and a live status region in `App`.

- [ ] **Step 1: Replace the shell test with failing integration-state tests**

Replace `src/app/App.test.tsx` with:

```tsx
import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { App } from './App'

function setModelContext(modelContext: WebMCP.ModelContext | undefined) {
  Object.defineProperty(document, 'modelContext', {
    configurable: true,
    value: modelContext,
  })
}

afterEach(() => {
  setModelContext(undefined)
})

describe('App', () => {
  it('renders the neutral WebMCP foundation shell', () => {
    setModelContext(undefined)
    render(<App />)

    expect(
      screen.getByRole('heading', { name: 'Jem WebMCP Demo' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Ready for the Figma handoff.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(
      'WebMCP is unavailable in this browser.',
    )
  })

  it('announces readiness after the browser registers the tool', async () => {
    const registerTool = vi.fn<WebMCP.ModelContext['registerTool']>()
    registerTool.mockResolvedValue(undefined)
    setModelContext({ registerTool } as WebMCP.ModelContext)

    render(<App />)

    expect(
      await screen.findByText('WebMCP is ready with 1 tool.'),
    ).toBeInTheDocument()
  })

  it('shows a non-blocking error when registration fails', async () => {
    const registerTool = vi.fn<WebMCP.ModelContext['registerTool']>()
    registerTool.mockRejectedValue(new Error('permission denied'))
    setModelContext({ registerTool } as WebMCP.ModelContext)

    render(<App />)

    expect(
      await screen.findByText('WebMCP tool registration failed.'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Jem WebMCP Demo' }),
    ).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the component tests and verify the red state**

Run:

```bash
mise exec node@20.19.2 -- npm test -- src/app/App.test.tsx
```

Expected: FAIL because the current `App` has no WebMCP status region.

- [ ] **Step 3: Implement the React lifecycle hook**

Create `src/webmcp/use-webmcp-status.ts`:

```ts
import { useEffect, useState } from 'react'

import { registerWebMcpTools } from './register-tools'
import type { WebMcpStatus } from './types'

export function useWebMcpStatus(): WebMcpStatus {
  const [status, setStatus] = useState<WebMcpStatus>({ state: 'registering' })

  useEffect(() => {
    return registerWebMcpTools(document.modelContext, setStatus)
  }, [])

  return status
}
```

- [ ] **Step 4: Render all registration states in the application shell**

Replace `src/app/App.tsx` with:

```tsx
import { useWebMcpStatus } from '../webmcp/use-webmcp-status'
import type { WebMcpStatus } from '../webmcp/types'

function getStatusCopy(status: WebMcpStatus): string {
  switch (status.state) {
    case 'registering':
      return 'Registering WebMCP tools…'
    case 'ready':
      return `WebMCP is ready with ${status.toolCount} tool${status.toolCount === 1 ? '' : 's'}.`
    case 'unsupported':
      return 'WebMCP is unavailable in this browser.'
    case 'error':
      return status.message
  }
}

export function App() {
  const webMcpStatus = useWebMcpStatus()

  return (
    <main className="app-shell">
      <section className="app-card" aria-labelledby="app-title">
        <p className="eyebrow">OpenAI WebMCP Challenge</p>
        <h1 id="app-title">Jem WebMCP Demo</h1>
        <p className="lede">Ready for the Figma handoff.</p>

        <div
          className={`status-panel status-panel--${webMcpStatus.state}`}
          role="status"
          aria-live="polite"
        >
          <span className="status-dot" aria-hidden="true" />
          <span>{getStatusCopy(webMcpStatus)}</span>
        </div>

        <p className="testing-note">
          Test site tools in ChatGPT’s in-app browser or Chrome with WebMCP
          testing enabled.
        </p>
      </section>
    </main>
  )
}
```

- [ ] **Step 5: Add compact status presentation styles**

Append to `src/styles.css`:

```css
.status-panel {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin-top: 2rem;
  padding: 0.85rem 1rem;
  border: 1px solid var(--border);
  border-radius: 0.85rem;
  background: var(--accent-soft);
  font-size: 0.925rem;
  line-height: 1.4;
}

.status-panel--error {
  background: var(--error-soft);
  color: var(--error);
}

.status-dot {
  width: 0.55rem;
  height: 0.55rem;
  flex: 0 0 auto;
  border-radius: 50%;
  background: currentColor;
}

.status-panel--registering .status-dot {
  animation: pulse 1.2s ease-in-out infinite;
}

.testing-note {
  margin: 1rem 0 0;
  color: var(--muted);
  font-size: 0.825rem;
  line-height: 1.5;
}

@keyframes pulse {
  50% {
    opacity: 0.35;
  }
}
```

- [ ] **Step 6: Verify the component and lifecycle tests pass**

Run:

```bash
mise exec node@20.19.2 -- npm test -- src/app/App.test.tsx src/webmcp/register-tools.test.ts
```

Expected: PASS with 7 tests.

- [ ] **Step 7: Commit the React integration**

```bash
git add src/app/App.tsx src/app/App.test.tsx src/styles.css src/webmcp/use-webmcp-status.ts
git commit -m "feat: surface WebMCP readiness in app"
```

---

### Task 5: Document, License, and Verify the Challenge Foundation

**Files:**
- Modify: `README.md`
- Create: `LICENSE`
- Modify mechanically if required: files reported by Prettier

**Interfaces:**
- Consumes: all commands and boundaries implemented in Tasks 1–4.
- Produces: clean-checkout instructions, extension guidance, manual browser verification, and a visible MIT license.

- [ ] **Step 1: Replace the README with runnable project documentation**

Replace `README.md` with:

````markdown
# Jem WebMCP Demo

A client-side React foundation for the [OpenAI WebMCP Challenge](https://openai.com/webmcp-challenge/). The product interface will be implemented from the upcoming Figma handoff; this repository currently focuses on a clean WebMCP integration boundary.

## Requirements

- Node.js 20.19 or newer
- npm 10 or newer
- A WebMCP-capable browser for native tool discovery

## Local development

```bash
npm install
npm run dev
```

Vite serves the app at `http://localhost:5173` by default.

## Quality checks

```bash
npm run check
```

This runs unit/component tests, ESLint, the Prettier check, TypeScript, and the production build.

## Architecture

The human UI and WebMCP tools share application capabilities:

```text
Human UI ───────┐
                ├─> application capability ─> state/UI result
WebMCP handler ─┘                         └─> structured tool result
```

- `src/app/` contains the React shell and framework-independent application capabilities.
- `src/webmcp/tools.ts` defines narrow tool schemas and delegates to those capabilities.
- `src/webmcp/register-tools.ts` detects support, registers tools, contains failures, and cleans up registrations with `AbortController`.
- `src/webmcp/use-webmcp-status.ts` binds that lifecycle to React.

WebMCP is progressive enhancement. Browsers without `document.modelContext` still render the human interface.

## Current site tool

`get_app_status` is a read-only foundation tool. It accepts no input and returns the app name, current phase, and WebMCP readiness. It exists to verify the integration and provide a concrete pattern for product tools after the Figma flow is implemented.

## Adding a product tool

1. Implement the user-visible operation as a plain application capability under `src/app/` or its future feature directory.
2. Test that capability independently.
3. Add a narrowly described tool in `src/webmcp/tools.ts` that calls the same capability.
4. Use a closed JSON Schema with `additionalProperties: false`.
5. Validate handler assumptions even though the browser checks the schema.
6. Mark read-only tools with `annotations.readOnlyHint: true` and describe side effects for write tools.
7. Return enough structured information for the agent and user to verify the result.

## Testing native WebMCP

Automated tests cover feature detection, tool definitions, handler execution, registration, failure containment, and abort cleanup. Native browser discovery must be checked in a compatible browser:

### ChatGPT desktop app

1. Run or deploy the app.
2. Open it in ChatGPT’s in-app browser using GPT-5.6 Sol or GPT-5.6 Terra.
3. Open **Site tools** in the browser address bar.
4. Confirm `get_app_status` appears under available site tools.
5. Ask the agent to read the application status and confirm the structured result matches the visible page.

### Google Chrome

1. Open `chrome://flags/#enable-webmcp-testing`.
2. Enable WebMCP testing and restart Chrome.
3. Open the running or deployed app in a top-level tab.
4. Use a compatible browser agent to discover and invoke `get_app_status`.

The app intentionally does not polyfill WebMCP. An unsupported browser shows a non-blocking status while preserving the interface.

## License

[MIT](LICENSE)
````

- [ ] **Step 2: Add the open-source license required by the challenge**

Create `LICENSE`:

```text
MIT License

Copyright (c) 2026 Jem

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 3: Run Prettier and review its exact changes**

Run:

```bash
mise exec node@20.19.2 -- npm run format
git diff --check
git diff --stat
```

Expected: Prettier exits 0, `git diff --check` reports no whitespace errors, and the diff contains only project files from this plan.

- [ ] **Step 4: Run the full completion gate**

Run:

```bash
mise exec node@20.19.2 -- npm run check
```

Expected: all 11 tests pass, ESLint reports zero errors, Prettier reports all files formatted, TypeScript exits 0, and Vite produces `dist/` successfully.

- [ ] **Step 5: Inspect the final repository state**

Run:

```bash
git status --short
git diff --check
git diff -- README.md LICENSE package.json src
```

Expected: only the intended Task 5 documentation/license changes plus any mechanical Prettier changes are uncommitted, and no whitespace errors are reported.

- [ ] **Step 6: Commit the verified foundation documentation**

```bash
git add README.md LICENSE .gitignore .prettierignore package.json package-lock.json eslint.config.js tsconfig.json vite.config.ts index.html src docs/superpowers/specs/2026-08-28-webmcp-foundation-design.md docs/superpowers/plans/2026-08-28-webmcp-foundation.md
git commit -m "docs: document WebMCP challenge foundation"
```

- [ ] **Step 7: Re-run verification after the final commit**

Run:

```bash
mise exec node@20.19.2 -- npm run check
git status --short
```

Expected: the full check exits 0 and `git status --short` prints nothing.
