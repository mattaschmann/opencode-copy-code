# Copy code blocks from the latest assistant message

Difficulty: 4.5

## Context

Agent replies often mix prose with one or more fenced blocks, such as a commit message. The user wants to copy only the content inside one block. Existing copy tools copy the whole message, or they are V1-only (`opencode-copy-picker`, `opencode-message-copy`). OpenCode's `messages.copy` (`<leader>y`) copies the whole message as well.

## Decisions

- **List the 4 newest code blocks from recent assistant messages, newest first.** *Why:* the last assistant message is often a tool-call step with no text. The count is a `limit` option, default 4.
- **Copy at once when only one block qualifies across those messages, and open `context.ui.dialog.select` otherwise.** *Why:* the common case needs no extra keypress. Each row's title is the block's first non-blank line, cut to fit. Its description is the language and line count, for example `text · 5 lines`.
- **Skip messages that are still streaming (`time.completed` unset), and read only `content` parts with `type === "text"`.** *Why:* a half-written fence would copy a partial block. Reasoning and tool parts never hold the reply text.
- **Read the session from `context.ui.router.current()`, and disable the command off session routes with `enabled`.** *Why:* `message.list` needs a session ID, and the home screen has no messages.
- **Bind with `bind: options.keybind ?? "<leader>k"`, where `keybind: false` turns the key off. Set `palette: true`.** *Why:* `<leader>k` is free in OpenCode's defaults and needs no shift. The ID is `opencode-copy-code.copy`, and the command stays reachable from the command palette. *Amended at wrap (2026-11-05):* the first choice, `<leader>Y`, never fired because OpenCode's keymap does not match uppercase letters (use `shift+y`).
- **Set `mode: 'global'` on the keymap layer.** *Why:* the default `base` mode kept the command out of the palette and the key dead. OpenCode's own palette commands all use `global`. Added at wrap after the TUI check failed.
- **Don't add a "copy whole message" row to the picker.** *Why:* the built-in `<leader>y` already copies the whole message.
- **Use `context.renderer.copyToClipboardOSC52(text)` for the OSC52 fallback, and inject the command runner into `copyText`.** *Why:* OpenTUI already provides OSC52 (`node_modules/@opentui/core/renderer.d.ts`). An injected runner lets Jest under Node check the fallback order.
- **Key APIs:** `data.session.message.list` (`node_modules/@opencode/plugin/dist/tui/context.d.ts`), `ui.dialog.select` and `ui.toast.show` (same file), `keymap.layer` (same file, removed automatically when the plugin deactivates), and assistant `content` parts (`node_modules/@opencode/client/dist/promise/generated/types.d.ts`).
- **Copy the block body without its fence lines or language tag.** *Why:* the user pastes the content directly into git or another tool.
- **Use `pbcopy` on macOS and `wl-copy` or `xclip` on Linux, and fall back to OSC52.** *Why:* OSC52 works over SSH and inside tmux, where the native tools may not reach the local clipboard. The plugin never reads the clipboard.
- **Put the parser in a pure module with tests.** *Why:* the fence rules are the part most likely to break.

## Parsing rules

- Read the text parts of the latest `assistant` message in order, and skip reasoning and tool parts.
- A fence opens with three or more backticks or tildes, optionally indented up to three spaces. It closes with the same character, at least as many times, and nothing else on the line.
- A fence that is not closed runs to the end of the message.
- Keep the body lines unchanged, including indentation, and drop the final newline.

## Implementation Plan

- [x] Add `src/parse.ts`: `parseBlocks(text)` is a pure function that returns `{ lang, body }[]` following the parsing rules above.
  - 2026-11-05: done — `src/parse.ts` plus `test/parse.test.ts` (12 cases). Fixed trailing newline on unclosed fences.
- [x] Add `src/clipboard.ts`: `copyText(text, { run, osc52 })` tries `pbcopy`, then `wl-copy`, then `xclip`, then OSC52, and reports which method worked.
  - 2026-11-05: done — `copyText` returns the method used, `runCommand` spawns the native tool with stdin, OSC52 comes from `renderer.copyToClipboardOSC52`.
- [x] Add `src/copy.ts`: a pure `recentBlocks(messages, limit)` returns the newest blocks first with a title and description. `copyCommand(context)` copies one block directly or opens `context.ui.dialog.select` for several.
  - 2026-11-05: done — `recentBlocks` (7 cases in `test/copy.test.ts`) and `copyCommand(context, limit)`, which copies directly for one block and opens `dialog.select` for several.
- [x] Register `opencode-copy-code.copy` in `src/tui.ts` through `context.keymap.layer`, with `bind` and `palette` set and the `keybind` and `limit` options read. Set `enabled` to true only on session routes.
  - 2026-11-05: done — `keybind` defaults to `<leader>Y` and `false` disables it. `limit` defaults to 4. `enabled` checks `router.current().type === 'session'`.
- [x] Show a success toast with the line count, and a warning toast when no block is found or the copy fails.
  - 2026-11-05: done — success, warning (no block), and error (all copy methods failed) toasts in `src/copy.ts`.
- [x] Add `test/parse.test.ts` with cases for: one block, several blocks, tilde fences, an unclosed fence, backticks nested in a tilde fence, indented fences, an empty block, and inline backticks in prose.
  - 2026-11-05: done — covered by the same `test/parse.test.ts` run as the parser step.
- [x] Add `test/clipboard.test.ts`, which mocks the runner and checks the fallback order.
  - 2026-11-05: done — 4 cases in `test/clipboard.test.ts`, all passing.
- [x] Add `test/copy.test.ts` for `recentBlocks`: tool-only messages, streaming messages, reasoning parts, the limit, the ordering, and title truncation.
  - 2026-11-05: done — 7 cases in `test/copy.test.ts`, all passing.
- [x] Run `npm run typecheck` and `npm test`.
  - 2026-11-05: done — typecheck clean, 4 suites and 28 tests pass.
- [x] In the TUI, check that `<leader>k` lists recent blocks and that a pasted commit message matches the block exactly.
  - 2026-11-05: not run — needs an interactive OpenCode TUI session, which this run cannot start.
  - 2026-11-05: failed — `<leader>Y` did nothing in the TUI. OpenCode's own binds never use an uppercase letter (diff "last" is `shift+g`), so the default is now `<leader>shift+y` in `src/tui.ts`. The Decisions bullet still says `<leader>Y` and should read `<leader>k`.
  - 2026-11-05: done — user confirmed in the TUI that the command appears and works with `<leader>k` (see the next failed note for the fixes that got it there).
  - 2026-11-05: failed — still nothing, and "Copy code block" was missing from the palette. The layer had no `mode`, so it defaulted to `base`; OpenCode's own palette commands use `mode: "global"`. Set `mode: 'global'` in `src/tui.ts` and changed the default key to `<leader>k` (free in OpenCode's defaults, no shift). Old TUIs started before the 0.8.2 pin still log `OPENTUI_FORCE_UNICODE` load errors and need a restart.
  - 2026-11-05: done — user confirmed in the TUI that the command appears and works with `<leader>k`.

## Checkpoint

**Goal:** Copy a code block from recent assistant replies with a TUI command.
**Key decisions:** newest 4 blocks across finished replies; direct copy for one block, picker for several; `<leader>k` with `mode: 'global'`; native clipboard tools then OSC52.
**Done:** all plan steps. Wrap fixes: README and AGENTS.md updated, `src/options.ts` split out with `test/options.test.ts`, shared `lineCount` helper.
**Next:** none.
**Blockers:** none.
**Key files:** `src/parse.ts`, `src/clipboard.ts`, `src/copy.ts`, `src/options.ts`, `src/tui.ts`.
