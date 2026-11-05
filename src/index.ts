/**
 * Server entrypoint. All behavior lives in the `./tui` sub-plugin; this entry
 * exists so OpenCode recognizes the package and loads its TUI export.
 */
import { Plugin } from '@opencode/plugin'

export default Plugin.define({
  id: 'opencode-copy-code',
  setup: () => () => {}
})
