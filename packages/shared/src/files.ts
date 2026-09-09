const LANGUAGES: Record<string, string> = {
  '.bash': 'bash',
  '.go': 'go',
  '.js': 'javascript',
  '.mjs': 'javascript',
  '.ps1': 'powershell',
  '.py': 'python',
  '.rb': 'ruby',
  '.sh': 'bash',
  '.ts': 'typescript',
};

export function fileExtension(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  // dot > 0 so dotfiles like `.envrc` don't count as an extension.
  return dot > 0 ? fileName.slice(dot).toLowerCase() : '';
}

export function languageForFile(fileName: string): string | null {
  return LANGUAGES[fileExtension(fileName)] ?? null;
}
