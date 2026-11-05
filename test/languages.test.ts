import { describe, it, expect } from '@jest/globals'
import { DEFAULT_LANGUAGES, resolveLanguages } from '../src/languages.js'

describe('resolveLanguages', () => {
  it('falls back to the defaults when options have no language list', () => {
    expect(resolveLanguages({})).toEqual([...new Set(DEFAULT_LANGUAGES)])
  })

  it('uses a configured list of strings', () => {
    expect(resolveLanguages({ languages: ['text', 'go'] })).toEqual(['text', 'go'])
  })

  it('falls back to the defaults when the configured value is malformed', () => {
    expect(resolveLanguages({ languages: 'text' })).toEqual([...new Set(DEFAULT_LANGUAGES)])
    expect(resolveLanguages({ languages: ['text', ''] })).toEqual([...new Set(DEFAULT_LANGUAGES)])
    expect(resolveLanguages({ languages: [1] })).toEqual([...new Set(DEFAULT_LANGUAGES)])
  })

  it('removes duplicates', () => {
    expect(resolveLanguages({ languages: ['text', 'text', 'go'] })).toEqual(['text', 'go'])
  })

  it('never returns built-in diagram and formula languages', () => {
    expect(resolveLanguages({ languages: ['mermaid', 'latex', 'math', 'text'] })).toEqual(['text'])
  })
})
