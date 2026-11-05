import { describe, it, expect } from '@jest/globals'
import { DEFAULT_KEYBIND, DEFAULT_LIMIT, resolveCopyOptions } from '../src/options.js'

describe('resolveCopyOptions', () => {
  it('uses the defaults when options are empty', () => {
    expect(resolveCopyOptions({})).toEqual({ keybind: DEFAULT_KEYBIND, limit: DEFAULT_LIMIT })
  })

  it('accepts a custom keybind and limit', () => {
    expect(resolveCopyOptions({ keybind: '<leader>j', limit: 8 })).toEqual({ keybind: '<leader>j', limit: 8 })
  })

  it('turns the key off with false', () => {
    expect(resolveCopyOptions({ keybind: false }).keybind).toBe(false)
  })

  it('falls back to the default key for an empty or non-string value', () => {
    expect(resolveCopyOptions({ keybind: '' }).keybind).toBe(DEFAULT_KEYBIND)
    expect(resolveCopyOptions({ keybind: 7 }).keybind).toBe(DEFAULT_KEYBIND)
    expect(resolveCopyOptions({ keybind: true }).keybind).toBe(DEFAULT_KEYBIND)
  })

  it('falls back to the default limit for zero, negative, fractional or non-number values', () => {
    for (const limit of [0, -1, 2.5, '3', null]) {
      expect(resolveCopyOptions({ limit }).limit).toBe(DEFAULT_LIMIT)
    }
  })
})
