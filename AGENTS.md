# AGENTS.md - opencode-copy-code

## Project Overview

OpenCode V2 TUI plugin. It draws fenced code blocks in a box so they stand apart from prose, and (planned) copies a code block from the latest assistant reply. Shipped as TypeScript source, loaded directly by OpenCode. No build step.

## Do

- Use TypeScript for all source files
- Use `@opencode/plugin` (V2) for type definitions and `Plugin.define`
- Register renderers only for languages in the configured list; never register `mermaid`, `latex`, or `math`
- Import `@opentui/*` and `solid-js` as types only; they are type-only dev dependencies. A runtime import loads a second copy of OpenTUI and crashes the TUI (`remove expects a renderable child object`)
- Fail quiet: log to stderr on errors, never throw from setup
- Run `npm run typecheck` and `npm test` before presenting changes

## Don't

- Add heavy or unnecessary dependencies
- Use default exports for the plugin entrypoint (`src/tui.ts`); named exports everywhere else
- Make large speculative changes without confirming with the user

## Commands

- `npm run typecheck` - Type check (`tsc --noEmit`)
- `npm test` - Run Jest tests (ESM mode)
- `npm run format` - Format with Prettier

## Project Structure

- `src/index.ts` - No-op server entry so OpenCode recognizes the package
- `src/tui.ts` - `./tui` entrypoint. Registers code-block renderers and returns a cleanup
- `src/languages.ts` - Default language list and `resolveLanguages`, which applies the `languages` option and drops `mermaid`, `latex`, `math`. Duplicate registrations are skipped by the try/catch in `src/tui.ts`, since the API has no renderer lookup
- `src/render.tsx` - Boxed wrapper around `defaultRender()`. JSX compiles under OpenCode's bundled `@opentui/solid`
- `test/` - Jest test suites
