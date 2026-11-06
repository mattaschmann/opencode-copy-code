# Add clickable copy button to code blocks

Each rendered code block shows a copy button that copies that block's contents to the clipboard on click, using the same clipboard path as `<leader>k`.

Difficulty: 3.0

## Scope

- In: a copy button on every code block rendered by the registered renderers (fenced blocks in the configured languages).
- Out: `mermaid`, `latex`, and `math` blocks; changes to the `<leader>k` command or its keybind.

## Acceptance criteria

- [x] Clicking the button copies the block body to the clipboard, verified by a unit test with an injected command runner.
  - 2026-11-06: verified — `copyBlock` tests in `test/copy.test.ts` pass with an injected runner; the user confirmed a click copies in the TUI.
- [x] The button renders inside the boxed block without breaking the existing render.
  - 2026-11-06: verified — the user confirmed in the TUI that the button works, first as the `copy` text and then as the `⧉` glyph.
- [x] `npm run typecheck` and `npm test` pass.
  - 2026-11-06: verified — typecheck clean, 5 suites and 35 tests pass.

## Origin

Captured from the dashboard TODO inbox on 2026-11-06:
- Can we add a "copy" button on the code blocks that we can click to copy the contents, much like exists on many webpages/ai chat windows?

## Decisions

- **Copy `token.text` straight from the renderer.** *Why:* `MarkdownCodeBlockRenderer` receives a `Tokens.Code` (`node_modules/@opentui/core/renderables/Markdown.d.ts:115`). Its `text` is the block body, so the button needs no message lookup and no `parseBlocks` call. `src/render.tsx:12` currently ignores this argument (`_token`).
- **Extract `copyBlock(context, body, run = runCommand)` from `copyCommand` in `src/copy.ts:52-60`.** It runs `copyText` with `run` and an OSC52 fallback through `context.renderer.copyToClipboardOSC52`, then shows the same success or error toast. `copyCommand` and the button both call it. *Why:* one copy path (strict DRY), and the injected `run` lets a unit test cover the copy without the TUI.
- **Dim ` ⧉ ` button, top-right, absolutely positioned in the panel's top padding row** (in the `<box>` at `src/render.tsx:22`, with `theme.text.muted`). *Why:* it doesn't change block height. A header row would add a line to every block. The `text.muted` token matches `opencode-kirocli-bridge/src/tui/theme.ts`.
  - *Amended at wrap (2026-11-06):* the label was first the text `copy`. After the TUI check the user switched it to the `⧉` glyph (U+29C9) padded with a space on each side.
- **Feedback is the existing toast ("Copied N lines" or the error toast). The label doesn't change.** *Why:* the button and `<leader>k` behave the same, and no signal or timer goes into the renderer that already crashed the TUI once.
- **Copy on `onMouseUp` when `button === 0`, and call `stopPropagation()` in both `onMouseDown` and `onMouseUp`.** *Why:* these are standard renderable props (`node_modules/@opentui/core/Renderable.d.ts:80`), and stopping the event keeps the click from starting a text selection or reaching the scrollbox.
- **If OpenCode never delivers mouse events to plugin renderables, stop, record it under `## Blockers`, and ask the user.** *Why:* only a TUI check can confirm it, and a workaround needs the user's sign-off.
- **Clicking during streaming copies the part of the block received so far.** *Why:* the renderer can't tell whether the reply is still streaming, and a partial copy is harmless.
- **Keep the existing rules.** `@opentui/*` and `solid-js` are type-only imports, and the button is JSX inside the existing box. *Why:* a runtime import loads a second OpenTUI copy and crashes the TUI (see `AGENTS.md`).

## Implementation Plan

- [x] Extract `copyBlock(context, body, run = runCommand)` in `src/copy.ts` and make `copyCommand` call it.
- [x] Add `copyBlock` tests to `test/copy.test.ts` with an injected runner and a stub context: the body reaches the runner, the success toast reports the line count, and the error toast shows when every method fails. (criteria: 1)
- [x] Add the absolutely positioned `⧉` button to the box in `src/render.tsx`. Its mouse handlers call `copyBlock(context, token.text)` and stop propagation.
- [x] Run `npm run typecheck` and `npm test`. (criteria: 3)
- [x] TUI check: the label shows top-right on tagged blocks, clicking copies the body and shows the toast, a streamed reply doesn't crash, and `mermaid` blocks have no button. (criteria: 2)
- [x] Mention the button in `README.md` and in the `src/render.tsx` line of `AGENTS.md`.
