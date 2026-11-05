export const DEFAULT_LANGUAGES = [
  'text',
  'bash',
  'sh',
  'shell',
  'diff',
  'go',
  'javascript',
  'js',
  'json',
  'python',
  'py',
  'rust',
  'toml',
  'ts',
  'typescript',
  'yaml'
] as const

const RESERVED = new Set(['mermaid', 'latex', 'math'])

export function resolveLanguages(options: Readonly<Record<string, unknown>>): string[] {
  const configured = options.languages
  const requested =
    Array.isArray(configured) && configured.every((v) => typeof v === 'string' && v.length > 0)
      ? configured
      : DEFAULT_LANGUAGES
  return [...new Set(requested)].filter((lang) => !RESERVED.has(lang))
}
