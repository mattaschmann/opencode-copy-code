# opencode-copy-code

OpenCode V2 TUI plugin. It draws fenced code blocks on a filled panel so they stand apart from the surrounding prose, and copies one code block from recent replies. Only blocks with a language tag are styled; bare fences and `mermaid`, `latex` and `math` blocks keep their default rendering.

## Copy a code block

Press `<leader>k`, or run **Copy code block** from the command palette, inside a session. The command looks at the newest code blocks in finished assistant replies. With one block it copies the block body at once. With several it opens a picker, newest first, and each row shows the first line plus the language and line count. The copy has no fence lines or language tag.

The clipboard tools are tried in this order: `pbcopy`, `wl-copy`, `xclip`, then OSC52, so copying also works over SSH and inside tmux.

## Install

Add the path to `plugins` in `~/.config/opencode/opencode.jsonc`, then restart the TUI:

```jsonc
"plugins": [
  "~/workspace/opencode-plugins/opencode-copy-code"
]
```

## Options

| Option | Default | Purpose |
|--------|---------|---------|
| `languages` | `text`, `bash`, `sh`, `shell`, `diff`, `go`, `javascript`, `js`, `json`, `python`, `py`, `rust`, `toml`, `ts`, `typescript`, `yaml` | Language tags to style. The API has no wildcard, so each tag is listed. |
| `keybind` | `<leader>k` | Key for the copy command. `false` removes the key; the palette entry stays. Write capitals as `shift+y`. |
| `limit` | `4` | How many of the newest code blocks the picker lists. |

A language that another plugin already registered is skipped, and the failure is logged to stderr.

## Development

```bash
npm run typecheck
npm test
```
