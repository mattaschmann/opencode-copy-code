import { describe, it, expect, jest } from '@jest/globals'
import type { SessionMessageInfo } from '@opencode/client'
import type { Plugin } from '@opencode/plugin/tui'
import { copyBlock, recentBlocks } from '../src/copy.js'
import type { Run } from '../src/clipboard.js'

type Assistant = {
  type: 'assistant'
  time: { created: number; completed?: number }
  content: Array<{ type: 'text'; text: string } | { type: 'reasoning'; text: string } | { type: 'tool' }>
}

function assistant(content: Assistant['content'], streaming = false): SessionMessageInfo {
  const completed = streaming ? undefined : 1
  return { type: 'assistant', time: { created: 0, completed }, content } as unknown as SessionMessageInfo
}

function text(value: string): { type: 'text'; text: string } {
  return { type: 'text', text: value }
}

describe('recentBlocks', () => {
  it('lists blocks newest first across messages', () => {
    const messages = [
      assistant([text('```ts\nold\n```')]),
      assistant([text('```bash\nnew one\n```\n```text\nnew two\n```')])
    ]
    expect(recentBlocks(messages, 4).map((c) => c.block.lang)).toEqual(['text', 'bash', 'ts'])
  })

  it('stops at the limit', () => {
    const messages = [assistant([text('```a\n1\n```\n```b\n2\n```\n```c\n3\n```')])]
    expect(recentBlocks(messages, 2).map((c) => c.block.lang)).toEqual(['c', 'b'])
  })

  it('skips messages that are still streaming', () => {
    const messages = [assistant([text('```a\n1\n```')]), assistant([text('```b\n2\n```')], true)]
    expect(recentBlocks(messages, 4).map((c) => c.block.lang)).toEqual(['a'])
  })

  it('ignores user messages and reasoning or tool parts', () => {
    const messages = [
      { type: 'user', time: { created: 0 }, content: [] } as unknown as SessionMessageInfo,
      assistant([{ type: 'reasoning', text: '```x\nhidden\n```' }, { type: 'tool' }, text('```y\nshown\n```')])
    ]
    expect(recentBlocks(messages, 4).map((c) => c.block.body)).toEqual(['shown'])
  })

  it('skips messages without blocks', () => {
    expect(recentBlocks([assistant([text('just prose')])], 4)).toEqual([])
  })

  it('titles with the first non-blank line and truncates long ones', () => {
    const long = 'x'.repeat(100)
    const [choice] = recentBlocks([assistant([text(`\`\`\`\n\n${long}\n\`\`\``)])], 1)
    expect(choice?.title).toHaveLength(60)
    expect(choice?.title.endsWith('…')).toBe(true)
  })

  it('describes language and line count', () => {
    const [one] = recentBlocks([assistant([text('```text\nfix: a\n```')])], 1)
    const [many] = recentBlocks([assistant([text('```\na\nb\nc\n```')])], 1)
    expect(one?.description).toBe('text · 1 line')
    expect(many?.description).toBe('plain · 3 lines')
  })
})

describe('copyBlock', () => {
  function stubContext(osc52Ok: boolean) {
    const toasts: Array<{ variant: string; message: string }> = []
    const context = {
      renderer: { copyToClipboardOSC52: jest.fn(() => osc52Ok) },
      ui: { toast: { show: (t: { variant: string; message: string }) => toasts.push(t) } }
    } as unknown as Plugin.Context
    return { context, toasts }
  }

  it('sends the body to the runner and reports the line count', async () => {
    const { context, toasts } = stubContext(false)
    const run = jest.fn<Run>(async () => true)
    await copyBlock(context, 'a\nb\nc', run)
    expect(run).toHaveBeenCalledWith('pbcopy', [], 'a\nb\nc')
    expect(toasts).toEqual([{ variant: 'success', message: 'Copied 3 lines' }])
  })

  it('shows an error toast when every method fails', async () => {
    const { context, toasts } = stubContext(false)
    await copyBlock(context, 'x', jest.fn<Run>(async () => false))
    expect(toasts).toEqual([{ variant: 'error', message: 'Could not copy to the clipboard.' }])
  })
})
