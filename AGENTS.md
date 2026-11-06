# AGENTS.md - opencode-copy-code

## Project Overview

OpenCode V2 TUI plugin. It draws fenced code blocks in a box so they stand apart from prose, and copies a code block from recent assistant replies with `<leader>k`. Shipped as TypeScript source, loaded directly by OpenCode. No build step.

## Do

- Use TypeScript for all source files
- Use `@opencode/plugin` (V2) for type definitions and `Plugin.define`
- Register renderers only for languages in the configured list; never register `mermaid`, `latex`, or `math`
- Import `@opentui/*` and `solid-js` as types only; they are type-only dev dependencies. A runtime import loads a second copy of OpenTUI and crashes the TUI (`remove expects a renderable child object`)
- Set `mode: 'global'` on `context.keymap.layer`. The default `base` mode keeps the command out of the command palette, and the key may not fire
- Write capital-letter keys as `shift+<key>`; OpenCode's keymap does not match an uppercase letter in a bind string
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
- `src/tui.ts` - `./tui` entrypoint. Registers code-block renderers and the `opencode-copy-code.copy` command, and returns a cleanup
- `src/options.ts` - `resolveCopyOptions`: the `keybind` (default `<leader>k`, `false` disables) and `limit` (default 4) options
- `src/parse.ts` - `parseBlocks`: pure fence parser returning `{ lang, body }[]`
- `src/clipboard.ts` - `copyText` tries `pbcopy`, `wl-copy`, `xclip`, then OSC52. The command runner is injected so tests can mock it
- `src/copy.ts` - `recentBlocks` picks the newest blocks from finished assistant messages; `copyCommand` copies one directly or opens the picker; `copyBlock` copies a body and shows the toast (shared with the in-block button)
- `src/languages.ts` - Default language list and `resolveLanguages`, which applies the `languages` option and drops `mermaid`, `latex`, `math`. Duplicate registrations are skipped by the try/catch in `src/tui.ts`, since the API has no renderer lookup
- `src/render.tsx` - Boxed wrapper around `defaultRender()`, with a `⧉` button that calls `copyBlock`. JSX compiles under OpenCode's bundled `@opentui/solid`
- `test/` - Jest test suites
- `.githooks/pre-commit` - Rejects staged secrets (`gitleaks`) and personal paths (`grep`). Enable with `git config core.hooksPath .githooks`
