import { Plugin } from '@opencode/plugin/tui'
import { boxedRenderer } from './render.js'
import { resolveLanguages } from './languages.js'
import { copyCommand } from './copy.js'
import { resolveCopyOptions } from './options.js'

const COPY_ID = 'opencode-copy-code.copy'

export default Plugin.define({
  id: 'opencode-copy-code.tui',
  setup: (context: Plugin.Context) => {
    const unregister: Array<() => void> = []
    const render = boxedRenderer(context)
    for (const language of resolveLanguages(context.options)) {
      try {
        unregister.push(context.markdown.registerCodeBlockRenderer(language, render))
      } catch (error) {
        console.error(`[opencode-copy-code] could not register ${language}: ${error}`)
      }
    }
    const { keybind, limit } = resolveCopyOptions(context.options)
    // 'global' keeps the command in the palette and active in every input mode; the default 'base' hides it.
    context.keymap.layer(() => ({
      mode: 'global',
      commands: [
        {
          id: COPY_ID,
          title: 'Copy code block',
          bind: keybind,
          palette: true,
          enabled: () => context.ui.router.current().type === 'session',
          run: () => copyCommand(context, limit)
        }
      ]
    }))
    return () => {
      for (const off of unregister) {
        try {
          off()
        } catch {
          /* ignore */
        }
      }
    }
  }
})
