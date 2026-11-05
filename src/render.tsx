import type { MarkdownCodeBlockRenderer, Renderable } from '@opentui/core'
import type { JSX } from '@opentui/solid'
import type { Plugin } from '@opencode/plugin/tui'

// JSX compiles under OpenCode's bundled @opentui/solid, so the box comes from the
// host's @opentui/core. Importing BoxRenderable here would load a second copy.
export function boxedRenderer(context: Plugin.Context): MarkdownCodeBlockRenderer {
  return (_token, renderContext) => {
    const inner = renderContext.defaultRender()
    if (!inner) return inner
    const fill = context.theme.background.raised.base
    // The code renderable paints its own background behind each glyph, and the host
    // sets its marginTop for spacing from the previous block; the outer box owns both.
    const code = inner as unknown as { bg?: unknown; marginTop?: number }
    code.bg = fill
    code.marginTop = 0
    return (
      <box shouldFill backgroundColor={fill} paddingLeft={1} paddingRight={1} flexDirection="column">
        {inner as unknown as JSX.Element}
      </box>
    ) as unknown as Renderable
  }
}
