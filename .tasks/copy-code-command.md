# Copy code blocks from the latest assistant message

## Context

Agent replies often mix prose with one or more fenced blocks, such as a commit message. The user wants to copy only the content inside one block. Existing copy tools copy the whole message, or they are V1-only (`opencode-copy-picker`, `opencode-message-copy`). OpenCode's `messages.copy` (`<leader>y`) copies the whole message as well.

## Decisions

- **Use the latest assistant message only.** *Why:* it covers the commit-message case, and older messages can be added later.
- **Copy at once when the message has one block, and show a picker when it has several.** *Why:* the common case needs no extra keypress.
- **Bind `<leader>Y` by default, configurable through plugin options.** *Why:* it sits next to the built-in `<leader>y`. The ID is `opencode-copy-code.copy`.
- **Copy the block body without its fence lines or language tag.** *Why:* the user pastes the content directly into git or another tool.
- **Use `pbcopy` on macOS and `wl-copy` or `xclip` on Linux, and fall back to OSC52.** *Why:* OSC52 works over SSH and inside tmux, where the native tools may not reach the local clipboard. The plugin never reads the clipboard.
- **Put the parser in a pure module with tests.** *Why:* the fence rules are the part most likely to break.

## Parsing rules

- Read the text parts of the latest `assistant` message in order, and skip reasoning and tool parts.
- A fence opens with three or more backticks or tildes, optionally indented up to three spaces. It closes with the same character, at least as many times, and nothing else on the line.
- A fence that is not closed runs to the end of the message.
- Keep the body lines unchanged, including indentation, and drop the final newline.

## Implementation Plan

- [ ] Add `src/parse.ts`, a pure function that takes message text and returns `{ lang, body }[]`, following the parsing rules above.
- [ ] Add `src/clipboard.ts` with `copyText(text)`. It tries `pbcopy`, then `wl-copy`, then `xclip`, then OSC52 through the renderer's output.
- [ ] Add `src/copy.ts` that reads the latest assistant message through `context.data.session.message.list(sessionID)`, then copies one block directly or opens `context.ui.dialog.select` for several.
- [ ] Register the `opencode-copy-code.copy` command with `context.keymap.layer`, bound to `<leader>Y` by default and overridable through options.
- [ ] Show a toast with the line count after copying, and a warning when the message has no block.
- [ ] Add parser tests for: one block, several blocks, tilde fences, an unclosed fence, nested backticks inside a tilde fence, indented fences, an empty block, and prose with inline backticks.
- [ ] Add a clipboard test that mocks the command runner and checks the fallback order.
- [ ] Run `npm run typecheck` and `npm test`.
- [ ] Check in the TUI that `<leader>Y` copies the commit message and that the paste matches the block exactly.

## Open questions

- Whether to also offer a "copy the whole message" choice in the picker.
- Whether the key should be `<leader>Y` or `<leader>c`, since `<leader>c` is taken by `session.compact` in some setups. Default: `<leader>Y`.
