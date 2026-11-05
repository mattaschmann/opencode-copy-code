import { spawn } from 'node:child_process'

export type Run = (command: string, args: string[], input: string) => Promise<boolean>

export interface ClipboardDeps {
  run: Run
  osc52: (text: string) => boolean
}

export type CopyMethod = 'pbcopy' | 'wl-copy' | 'xclip' | 'osc52'

const NATIVE: Array<{ method: CopyMethod; command: string; args: string[] }> = [
  { method: 'pbcopy', command: 'pbcopy', args: [] },
  { method: 'wl-copy', command: 'wl-copy', args: [] },
  { method: 'xclip', command: 'xclip', args: ['-selection', 'clipboard'] }
]

// Tries native clipboard tools in order, then OSC52. Returns the method that worked, or undefined.
export async function copyText(text: string, deps: ClipboardDeps): Promise<CopyMethod | undefined> {
  for (const { method, command, args } of NATIVE) {
    if (await deps.run(command, args, text)) return method
  }
  return deps.osc52(text) ? 'osc52' : undefined
}

// Runs a command with the text on stdin. Resolves false when the command is missing or fails.
export const runCommand: Run = (command, args, input) =>
  new Promise((resolve) => {
    const child = spawn(command, args, { stdio: ['pipe', 'ignore', 'ignore'] })
    child.on('error', () => resolve(false))
    child.on('close', (code) => resolve(code === 0))
    child.stdin.on('error', () => {})
    child.stdin.end(input)
  })
