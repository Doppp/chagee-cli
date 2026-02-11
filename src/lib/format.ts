export function maskPhone(phone: string): string {
  if (phone.length < 5) {
    return phone;
  }
  return `${phone.slice(0, 3)}****${phone.slice(-2)}`;
}

export function printTable(headers: string[], rows: string[][]): void {
  const widths = headers.map((h, i) => {
    let w = h.length;
    for (const row of rows) {
      w = Math.max(w, (row[i] ?? "").length);
    }
    return w;
  });

  const fmt = (cols: string[]): string =>
    cols
      .map((c, i) => {
        const val = c ?? "";
        return val.padEnd(widths[i] ?? val.length, " ");
      })
      .join("  ");

  console.log(fmt(headers));
  console.log(widths.map((w) => "-".repeat(w)).join("  "));
  for (const row of rows) {
    console.log(fmt(row));
  }
}

export function toNum(value: unknown): number | undefined {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}
