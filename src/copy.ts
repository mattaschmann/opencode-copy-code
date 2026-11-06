import type { SessionMessageInfo } from '@opencode/client'
import type { Plugin } from '@opencode/plugin/tui'
import { parseBlocks, type CodeBlock } from './parse.js'
import { copyText, runCommand, type Run } from './clipboard.js'

export interface BlockChoice {
  title: string
  description: string
  block: CodeBlock
}

const TITLE_MAX = 60

// Returns the newest code blocks across finished assistant messages, newest first.
export function recentBlocks(messages: readonly SessionMessageInfo[], limit: number): BlockChoice[] {
  const choices: BlockChoice[] = []
  for (const message of [...messages].reverse()) {
    if (message.type !== 'assistant' || message.time.completed === undefined) continue
    const text = message.content
      .filter((part) => part.type === 'text')
      .map((part) => part.text)
      .join('\n')
    for (const block of [...parseBlocks(text)].reverse()) {
      choices.push({ title: titleOf(block), description: describe(block), block })
      if (choices.length >= limit) return choices
    }
  }
  return choices
}

export async function copyCommand(context: Plugin.Context, limit: number): Promise<void> {
  const route = context.ui.router.current()
  if (route.type !== 'session') return
  const choices = recentBlocks(context.data.session.message.list(route.sessionID), limit)
  if (choices.length === 0) {
    context.ui.toast.show({ variant: 'warning', message: 'No code block in recent replies.' })
    return
  }
  const picked =
    choices.length === 1
      ? choices[0]
      : await context.ui.dialog.select<BlockChoice>({
          title: 'Copy code block',
          options: choices.map((choice) => ({
            title: choice.title,
            value: choice,
            description: choice.description
          }))
        })
  if (!picked) return
  await copyBlock(context, picked.block.body)
}

// Copies a block body and reports the result in a toast. Shared by the command and the in-block button.
export async function copyBlock(context: Plugin.Context, body: string, run: Run = runCommand): Promise<void> {
  const method = await copyText(body, {
    run,
    osc52: (text) => context.renderer.copyToClipboardOSC52(text)
  })
  if (!method) {
    context.ui.toast.show({ variant: 'error', message: 'Could not copy to the clipboard.' })
    return
  }
  context.ui.toast.show({ variant: 'success', message: `Copied ${lineCount(countLines(body))}` })
}

function lineCount(count: number): string {
  return `${count} ${count === 1 ? 'line' : 'lines'}`
}

function titleOf(block: CodeBlock): string {
  const line = block.body.split('\n').find((l) => l.trim() !== '')?.trim() ?? '(empty)'
  return line.length > TITLE_MAX ? `${line.slice(0, TITLE_MAX - 1)}…` : line
}

function countLines(body: string): number {
  return body === '' ? 0 : body.split('\n').length
}

function describe(block: CodeBlock): string {
  const lines = countLines(block.body)
  return `${block.lang || 'plain'} · ${lineCount(lines)}`
}
