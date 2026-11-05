export interface CodeBlock {
  lang: string
  body: string
}

const FENCE = /^ {0,3}(`{3,}|~{3,})(.*)$/

// Splits message text into fenced code blocks. Prose outside fences is ignored.
export function parseBlocks(text: string): CodeBlock[] {
  const lines = (text.endsWith('\n') ? text.slice(0, -1) : text).split('\n')
  const blocks: CodeBlock[] = []
  let i = 0
  while (i < lines.length) {
    const open = FENCE.exec(lines[i] ?? '')
    if (!open || (open[1]?.startsWith('`') && open[2]?.includes('`'))) {
      i++
      continue
    }
    const fence = open[1] ?? ''
    const char = fence[0]
    const lang = (open[2] ?? '').trim().split(/\s+/)[0] ?? ''
    const body: string[] = []
    let j = i + 1
    let closed = false
    for (; j < lines.length; j++) {
      const line = lines[j] ?? ''
      if (isClosing(line, char, fence.length)) {
        closed = true
        break
      }
      body.push(line)
    }
    blocks.push({ lang, body: body.join('\n') })
    i = closed ? j + 1 : lines.length
  }
  return blocks
}

function isClosing(line: string, char: string | undefined, minLength: number): boolean {
  const match = /^ {0,3}(`+|~+)[ \t]*$/.exec(line)
  return !!match && match[1]!.startsWith(char ?? '') && match[1]!.length >= minLength
}
