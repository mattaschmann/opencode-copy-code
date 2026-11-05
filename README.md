# opencode-copy-code

OpenCode V2 TUI plugin. It draws fenced code blocks on a filled panel so they stand apart from the surrounding prose. Only blocks with a language tag are styled; bare fences and `mermaid`, `latex` and `math` blocks keep their default rendering.

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

A language that another plugin already registered is skipped, and the failure is logged to stderr.

## Development

```bash
npm run typecheck
npm test
```
