export function padNum(n: number, padding: number): string {
  const s = String(Math.max(0, Math.floor(n)));
  if (padding <= 0) return s;
  return s.padStart(padding, "0");
}

export function parseEnum(raw: string): string[] {
  return raw
    .split(/[,，]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function escapeCsvCell(v: string): string {
  if (/[",\n\r]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

export function rowsToCsvString(rows: string[][]): string {
  const lines = rows.map((row) => row.map(escapeCsvCell).join(","));
  return `\uFEFF${lines.join("\r\n")}`;
}
