# Jem WebMCP Demo

A client-side React foundation for the [OpenAI WebMCP Challenge](https://openai.com/webmcp-challenge/). The product interface will be implemented from the upcoming Figma handoff; this repository currently focuses on a clean WebMCP integration boundary.

## Requirements

- Node.js 22.22.2 or newer
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
