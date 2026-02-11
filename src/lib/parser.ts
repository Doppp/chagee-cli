export function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let quote: '"' | "'" | null = null;
  let escaping = false;

  for (const ch of input.trim()) {
    if (escaping) {
      current += ch;
      escaping = false;
      continue;
    }

    if (ch === "\\") {
      escaping = true;
      continue;
    }

    if (quote) {
      if (ch === quote) {
        quote = null;
      } else {
        current += ch;
      }
      continue;
    }

    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }

    if (/\s/.test(ch)) {
      if (current.length > 0) {
        tokens.push(current);
        current = "";
      }
      continue;
    }

    current += ch;
  }

  if (current.length > 0) {
    tokens.push(current);
  }

  return tokens;
}

export function parseKeyValueTokens(tokens: string[]): {
  args: string[];
  opts: Record<string, string>;
} {
  const args: string[] = [];
  const opts: Record<string, string> = {};

  for (const token of tokens) {
    const idx = token.indexOf("=");
    if (idx <= 0) {
      args.push(token);
      continue;
    }
    const key = token.slice(0, idx);
    const value = token.slice(idx + 1);
    if (key.length > 0) {
      opts[key] = value;
    }
  }

  return { args, opts };
}

export function parseBool(input: string | undefined, fallback = false): boolean {
  if (!input) {
    return fallback;
  }
  const normalized = input.toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }
  return fallback;
}

export function parseNum(input: string | undefined, fallback: number): number {
  if (!input) {
    return fallback;
  }
  const n = Number(input);
  return Number.isFinite(n) ? n : fallback;
}
