import { Plugin } from '@opencode/plugin/tui'
import { boxedRenderer } from './render.js'
import { resolveLanguages } from './languages.js'

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
