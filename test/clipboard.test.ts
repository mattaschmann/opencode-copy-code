import { describe, it, expect, jest } from '@jest/globals'
import { copyText, type Run } from '../src/clipboard.js'

function fakeRun(working: string[]): jest.Mock<Run> {
  return jest.fn<Run>(async (command) => working.includes(command))
}

describe('copyText', () => {
  it('uses pbcopy first when it works', async () => {
    const run = fakeRun(['pbcopy', 'wl-copy', 'xclip'])
    const osc52 = jest.fn(() => true)
    expect(await copyText('hi', { run, osc52 })).toBe('pbcopy')
    expect(run.mock.calls.map((c) => c[0])).toEqual(['pbcopy'])
    expect(osc52).not.toHaveBeenCalled()
  })

  it('falls back to wl-copy, then xclip, in that order', async () => {
    const run = fakeRun(['xclip'])
    const osc52 = jest.fn(() => true)
    expect(await copyText('hi', { run, osc52 })).toBe('xclip')
    expect(run.mock.calls.map((c) => c[0])).toEqual(['pbcopy', 'wl-copy', 'xclip'])
    expect(run.mock.calls[2]).toEqual(['xclip', ['-selection', 'clipboard'], 'hi'])
  })

  it('falls back to OSC52 when no native tool works', async () => {
    const run = fakeRun([])
    const osc52 = jest.fn<(text: string) => boolean>(() => true)
    expect(await copyText('hi', { run, osc52 })).toBe('osc52')
    expect(osc52).toHaveBeenCalledWith('hi')
  })

  it('returns undefined when every method fails', async () => {
    const run = fakeRun([])
    expect(await copyText('hi', { run, osc52: () => false })).toBeUndefined()
  })
})
