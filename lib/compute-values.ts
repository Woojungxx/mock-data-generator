import type { FieldRule, FieldType } from "@/types";
import { padNum, parseEnum } from "@/lib/text-utils";

export type RandomSource = {
  intInclusive: (min: number, max: number) => number;
  randomString: (length: number) => string;
  uuid: () => string;
};

function randomBetweenDates(start: Date, end: Date, rng: RandomSource): Date {
  const a = start.getTime();
  const b = end.getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) return new Date();
  const t = a + rng.intInclusive(0, b - a);
  return new Date(t);
}

export function computeCellValue(rule: FieldRule, rowIndex: number, rng: RandomSource): string {
  const { type, config } = rule;
  switch (type as FieldType) {
    case "fixed":
      return config.value ?? "";
    case "increment_number": {
      const start = config.start ?? 1;
      const step = config.step ?? 1;
      return String(start + rowIndex * step);
    }
    case "increment_string": {
      const prefix = config.prefix ?? "";
      const suffix = config.suffix ?? "";
      const start = config.start ?? 1;
      const padding = config.padding ?? 4;
      return `${prefix}${padNum(start + rowIndex, padding)}${suffix}`;
    }
    case "random_number": {
      const min = config.min ?? 0;
      const max = config.max ?? 100;
      const lo = Math.min(min, max);
      const hi = Math.max(min, max);
      return String(rng.intInclusive(lo, hi));
    }
    case "random_string": {
      const len = Math.max(1, Math.min(512, config.length ?? 8));
      return rng.randomString(len);
    }
    case "uuid":
      return rng.uuid();
    case "enum_random": {
      const list = parseEnum(config.enumValues ?? "");
      if (!list.length) return "";
      return list[rng.intInclusive(0, list.length - 1)]!;
    }
    case "datetime": {
      const s = config.startDate ? new Date(config.startDate) : new Date(Date.now() - 864e5);
      const e = config.endDate ? new Date(config.endDate) : new Date();
      const d = randomBetweenDates(s, e, rng);
      return d.toISOString();
    }
    default:
      return "";
  }
}

export function generateRowsWithRng(
  fields: FieldRule[],
  rowCount: number,
  rng: RandomSource
): string[][] {
  const headers = fields.map((f) => f.name);
  const rows: string[][] = [headers];
  for (let i = 0; i < rowCount; i++) {
    rows.push(fields.map((f) => computeCellValue(f, i, rng)));
  }
  return rows;
}
