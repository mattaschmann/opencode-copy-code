export const DEFAULT_KEYBIND = '<leader>k'
export const DEFAULT_LIMIT = 4

export interface CopyOptions {
  keybind: string | false
  limit: number
}

export function resolveCopyOptions(options: Readonly<Record<string, unknown>>): CopyOptions {
  const { keybind, limit } = options
  return {
    keybind: keybind === false ? false : typeof keybind === 'string' && keybind ? keybind : DEFAULT_KEYBIND,
    limit: typeof limit === 'number' && Number.isInteger(limit) && limit > 0 ? limit : DEFAULT_LIMIT
  }
}
