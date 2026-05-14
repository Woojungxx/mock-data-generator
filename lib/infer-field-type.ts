import type { FieldRule, FieldType } from "@/types";
import { randomId } from "@/lib/utils";

const INCREMENT_STRING = /^(.+?)(\d+)$/;
const SEMVER = /^\d+\.\d+\.\d+$/;
const COUNTRY_LIKE = /^[A-Z]{2}$/;
const DIGITS_ONLY = /^\d+$/;

function defaultConfigForType(type: FieldType, raw: string): FieldRule["config"] {
  switch (type) {
    case "fixed":
      return { value: raw };
    case "increment_number": {
      const n = parseInt(raw, 10);
      return { start: Number.isFinite(n) ? n : 1, step: 1 };
    }
    case "increment_string": {
      const m = raw.match(INCREMENT_STRING);
      if (m) {
        const numStr = m[2];
        const prefix = m[1];
        const start = parseInt(numStr, 10) || 1;
        return { prefix, start, padding: numStr.length };
      }
      return { prefix: "item_", start: 1, padding: 4 };
    }
    case "random_number":
      return { min: 0, max: 99999 };
    case "random_string":
      return { length: 8 };
    case "uuid":
      return {};
    case "enum_random":
      return { enumValues: raw };
    case "datetime":
      return {
        startDate: new Date(Date.now() - 7 * 864e5).toISOString(),
        endDate: new Date().toISOString(),
      };
    default:
      return { value: raw };
  }
}

export function inferFieldType(sample: string): FieldType {
  const s = sample.trim();
  if (!s) return "fixed";

  if (SEMVER.test(s)) return "fixed";

  /** 长串复合设备号等，默认固定值，避免把尾部短数字误判为递增片段 */
  if (s.length > 14 && /[A-Za-z]/.test(s) && /\d/.test(s) && !/_0{2,}\d+$/.test(s)) {
    return "fixed";
  }

  const inc = s.match(INCREMENT_STRING);
  if (inc && inc[2].length >= 1) {
    const num = inc[2];
    if (num.length >= 3 && /^0+$/.test(num) === false && /^0\d+$/.test(num)) {
      return "increment_string";
    }
    if (DIGITS_ONLY.test(s)) return "increment_number";
    if (num.length > 1 && num.startsWith("0")) return "increment_string";
    if (!DIGITS_ONLY.test(s)) return "increment_string";
  }

  if (DIGITS_ONLY.test(s)) return "increment_number";

  if (COUNTRY_LIKE.test(s)) return "enum_random";

  if (s.includes(",") && s.split(",").every((p) => p.trim().length > 0)) {
    return "enum_random";
  }

  return "fixed";
}

export function buildFieldRuleFromHeader(
  name: string,
  sample: string
): FieldRule {
  const type = inferFieldType(sample);
  return {
    id: randomId(),
    name,
    type,
    sample,
    config: defaultConfigForType(type, sample),
  };
}
