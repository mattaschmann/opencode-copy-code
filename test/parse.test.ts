import { describe, it, expect } from '@jest/globals'
import { parseBlocks } from '../src/parse.js'

describe('parseBlocks', () => {
  it('returns one block with its language and body', () => {
    const text = 'Here it is:\n\n```text\nfix: thing\n\nbody\n```\n\nDone.'
    expect(parseBlocks(text)).toEqual([{ lang: 'text', body: 'fix: thing\n\nbody' }])
  })

  it('returns several blocks in order', () => {
    const text = '```ts\nconst a = 1\n```\nprose\n```bash\nls\n```'
    expect(parseBlocks(text)).toEqual([
      { lang: 'ts', body: 'const a = 1' },
      { lang: 'bash', body: 'ls' }
    ])
  })

  it('accepts tilde fences', () => {
    expect(parseBlocks('~~~py\nprint(1)\n~~~')).toEqual([{ lang: 'py', body: 'print(1)' }])
  })

  it('runs an unclosed fence to the end of the message', () => {
    expect(parseBlocks('```go\nfunc main() {}\nmore\n')).toEqual([
      { lang: 'go', body: 'func main() {}\nmore' }
    ])
  })

  it('keeps backticks nested inside a tilde fence as body text', () => {
    const text = '~~~md\n```js\nlet x\n```\n~~~'
    expect(parseBlocks(text)).toEqual([{ lang: 'md', body: '```js\nlet x\n```' }])
  })

  it('needs a closing fence at least as long as the opening one', () => {
    const text = '````\n```\nstill open\n````'
    expect(parseBlocks(text)).toEqual([{ lang: '', body: '```\nstill open' }])
  })

  it('accepts fences indented up to three spaces and keeps body indentation', () => {
    const text = '   ```yaml\n   a: 1\n     b: 2\n   ```'
    expect(parseBlocks(text)).toEqual([{ lang: 'yaml', body: '   a: 1\n     b: 2' }])
  })

  it('ignores a fence indented four spaces', () => {
    expect(parseBlocks('    ```\n    code\n    ```')).toEqual([])
  })

  it('returns an empty body for an empty block', () => {
    expect(parseBlocks('```\n```')).toEqual([{ lang: '', body: '' }])
  })

  it('does not treat inline backticks in prose as a fence', () => {
    expect(parseBlocks('Run `npm test` or ```inline``` here.')).toEqual([])
  })

  it('does not close on a line with text after the fence', () => {
    expect(parseBlocks('```\nx\n``` not a close\ny')).toEqual([{ lang: '', body: 'x\n``` not a close\ny' }])
  })

  it('returns nothing when there are no blocks', () => {
    expect(parseBlocks('just prose')).toEqual([])
  })
})
