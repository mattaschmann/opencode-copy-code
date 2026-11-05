# Spike: boxed renderer for fenced code blocks

## Context

OpenCode V2 draws fenced code blocks the same as surrounding prose, so a copied commit message is hard to tell apart from the text around it. The commit-message skill now asks for a ```` ```text ```` fence (`~/workspace/dotfiles/ai/skills/commit-message/SKILL.md`), which fixes the fence but not the look.

## Findings

- No plugin or setting styles code blocks. The theme `markdown.code` token only sets text color, and `markdown.codeBlock` is not read anywhere I could find.
- `context.markdown.registerCodeBlockRenderer(language, render)` is the only seam. It takes one language name, and OpenCode throws if a second plugin registers the same language.
- OpenTUI calls the renderer only for blocks with a language tag. Bare ```` ``` ```` blocks always use the default renderer.
- Built-in plugins own `mermaid`, `latex` and `math`. This plugin must not register those.
- Tags are normalized to a file type before lookup, so `typescript` also matches `ts`.

## Decisions

- **Register a fixed default list of languages, configurable through plugin options.** *Why:* the API has no wildcard. The default list covers `text` and common languages.
- **Skip languages that already have a renderer.** *Why:* a duplicate registration throws, and a throw must not break the other registrations.
  - *Amended at wrap (2026-11-05):* the API has no renderer lookup, so there is no filter. The try/catch around each registration skips duplicates and logs to stderr.
- **Keep built-in diagram and formula languages out of the list.** *Why:* the built-in plugins draw them better than a box would.
- **Use `context.theme.background.raised.base` for the fill and `context.theme.hue.accent[400]` for the border.** *Why:* semantic tokens follow the selected theme in light and dark mode.
  - *Amended at wrap (2026-11-05):* the border was dropped after TUI testing. The box is a borderless fill with 1 cell of left and right padding, and the code renderable's `bg` is set to the fill. The box is built as JSX, and `@opentui/*` are type-only imports (see Results).
- **Keep the default block renderer output inside the box.** *Why:* `defaultRender()` keeps syntax highlighting.

## Implementation Plan

- [x] Scaffold `opencode-copy-code/` as a Node package with `package.json` (`exports["./tui"] = ./src/tui.ts`, `@opencode/plugin` 2.0.22, peer deps `@opentui/core`, `@opentui/solid`, `solid-js`), `tsconfig.json`, `.gitignore`, and an `AGENTS.md` modeled on `opencode-ping/AGENTS.md`.
  - 2026-11-05: done — added package.json, tsconfig.json, .gitignore, AGENTS.md, jest.config.js (no setupFiles, since there is no test/setup.ts); npm install ran.
- [x] Add `src/tui.ts` with `Plugin.define({ id: "opencode-copy-code.tui", setup })`. It reads the language list from `context.options`, falling back to the defaults.
  - 2026-11-05: done — `Plugin.define` in `src/tui.ts`; `Plugin.Context` is the context type (no top-level `Context` export in `@opencode/plugin/tui`).
- [x] Add `src/languages.ts` with the default language list and a pure function that drops languages without a renderer.
  - 2026-11-05: done — deviation: `resolveLanguages` drops only reserved languages (`mermaid`, `latex`, `math`). The API has no lookup for existing renderers, so `src/tui.ts` relies on the try/catch around registration to skip duplicates.
- [x] Add `src/render.ts` that wraps `defaultRender()` in a `BoxRenderable` with the fill and border colors above. Register each language with a try/catch that logs the failure to stderr and continues.
  - 2026-11-05: done — `boxedRenderer` in `src/render.ts`; registration try/catch in `src/tui.ts`. Visual result not yet checked in the TUI.
- [x] Return a cleanup function from `setup` that calls each unregister function.
  - 2026-11-05: done — cleanup in `src/tui.ts` calls each unregister function.
- [x] Run `npm run typecheck`.
  - 2026-11-05: done — passes (exit 0).
- [x] Add a test for the language filter and the option fallback.
  - 2026-11-05: done — `test/languages.test.ts`, 5 tests.
- [x] Run `npm test`.
  - 2026-11-05: done — 1 suite, 5 tests passed.
- [x] Add the plugin to `~/.config/opencode/cli.json` under `plugins`, after backing up the file to `cli.json.bak`.
  - 2026-11-05: done — `cli.json` has no `plugins` key, so per the user I followed the other plugins: backed up `opencode.jsonc` to `opencode.jsonc.bak` and added the path to its `plugins` list.
- [x] Restart the TUI, or run `/reload`, and confirm the plugin loads with `opencode plugin list`.
  - 2026-11-05: partial — the plugin is listed, but with ID and version `-`. Added `src/index.ts` and a `.` export to `package.json` to match the other plugins; the list is unchanged. Needs a TUI restart to confirm.
  - 2026-11-05: failed — TUI load error in the log: `OPENTUI_FORCE_UNICODE is already registered with different configuration`. Cause: the plugin installed `@opentui/core` 0.5.17 while OpenCode bundles 0.8.2.
  - 2026-11-05: fix applied — pinned `@opentui/core` and `@opentui/solid` 0.8.2, `solid-js` 1.9.17, `@opencode/plugin` 2.2.5 (as in opencode-kirocli-bridge), added the `solid-js` override, reinstalled. Typecheck and 5 tests pass. Needs a TUI restart to confirm.
  - 2026-11-05: loaded after the pin, then the TUI crashed while a reply streamed: `remove expects a renderable child object`. Cause: `src/render.ts` imported `BoxRenderable` at runtime from the plugin's own `@opentui/core`, so the box and the host's `defaultRender()` output came from two copies and failed `instanceof`.
  - 2026-11-05: fix applied — replaced `src/render.ts` with `src/render.tsx`, which builds a `<box>` under OpenCode's bundled `@opentui/solid`; `@opentui/*` is type-only now (`tsconfig.json` has `jsx: preserve`, `jsxImportSource: @opentui/solid`). Typecheck and 5 tests pass. Not yet confirmed in the TUI; test with a streamed reply.
  - 2026-11-05: done — the plugin loads and streamed replies no longer crash (see Results).
- [x] Ask a model for a commit message, then check that the ```` ```text ```` block shows the box. Record the result below.
  - 2026-11-05: done — `text` block shows the grey panel (see Results).
- [x] Check a ```` ```ts ```` block the same way. Record the result below.
  - 2026-11-05: done — `ts` block shows the panel with syntax highlighting (see Results).
- [x] Check that a mermaid diagram still renders as a diagram.
  - 2026-11-05: done — mermaid still renders as a diagram without a panel.

## Blockers

- 2026-11-05: resolved. The TUI checks were done by the user and are recorded under Results.

## Results

- 2026-11-05: first TUI run after the JSX fix, with streamed replies: no crash. `text` and `ts` blocks boxed (`ts` keeps syntax highlighting), `diff` boxed with colored lines, `mermaid` still a diagram without a box.
- 2026-11-05: the box had a grey band around the purple border (the fill reached the border cells) and dark strips behind each text line (the code renderable's own `bg`).
- 2026-11-05: changed `src/render.tsx` to a borderless filled outer box with 1 cell of padding, a purple-bordered inner box, and the code renderable's `bg` set to the fill. This replaces the single filled-and-bordered box in the Decisions section. Not yet checked in the TUI.
- 2026-11-05: second TUI run: dark strips behind the text were gone, but the purple border was unwanted and the grey panel was too tall (1 row of padding, 2 border rows, and a blank row from the code renderable's `marginTop`).
- 2026-11-05: changed `src/render.tsx` again to a single borderless filled box with 1 cell of left and right padding only, and `marginTop` of the code renderable set to 0. No purple border now, which departs from the Decisions section. Not yet checked in the TUI.
- 2026-11-05: third TUI run: the user reports it "looks mostly good" with the borderless filled panel. The one remaining complaint, literal backticks in the last block, came from my test example (a `text` block containing backticks), not from the plugin.
- Untagged block (bare fence): not yet checked.
- 2026-11-05: wrap review fixes: amended two Decisions entries, corrected the `AGENTS.md` line for `src/languages.ts`, added `README.md`, and added `glob` and `minimatch` overrides to `package.json` (same as opencode-kirocli-bridge). `npm audit` went from 26 moderate to 6 low, all dev-only via Jest's `deepmerge`; production dependencies have 0. Typecheck and 5 tests pass. Left open: `src/tui.ts` and `src/render.tsx` have no tests.

## Summary

The spike works. `registerCodeBlockRenderer` boxes tagged blocks (`text`, `ts`, `diff`) with a grey panel and leaves `mermaid` alone. Two things differ from the Decisions section: the box is a borderless fill (`theme.background.raised.base`, no `accent[400]` border), and `@opentui/*` must be type-only imports with the box built as JSX, because a runtime import loads a second OpenTUI copy and crashes the TUI during streaming.
