import Papa, { type ParseError } from "papaparse";
import * as XLSX from "xlsx";
import { buildFieldRuleFromHeader } from "@/lib/infer-field-type";
import type { FieldRule } from "@/types";

export type ParsedUpload = {
  fields: FieldRule[];
  headers: string[];
  rowCountSample: number;
};

function firstRowSamples(headers: string[], rows: Record<string, unknown>[]) {
  const first = rows[0] ?? {};
  return headers.map((h) => {
    const v = first[h];
    if (v === undefined || v === null) return "";
    return String(v).trim();
  });
}

function stripBom(input: string): string {
  return input.replace(/^\uFEFF/, "");
}

/** PapaParse 在单列/无逗号等场景会报 Delimiter 提示，实际已回退为逗号，不应视为失败 */
function isIgnorablePapaError(e: ParseError): boolean {
  if (e.type === "Delimiter") return true;
  if (e.code === "UndetectableDelimiter") return true;
  const msg = e.message ?? "";
  if (/auto-detect delimiting/i.test(msg)) return true;
  return false;
}

export function parseCsvBuffer(buf: Buffer): ParsedUpload {
  const text = stripBom(buf.toString("utf8"));
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    /** 显式逗号，避免单列模板触发「无法自动检测分隔符」 */
    delimiter: ",",
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim(),
  });

  if (parsed.errors?.length) {
    const fatal = parsed.errors.find((e) => !isIgnorablePapaError(e) && (e.type === "Quotes" || e.type === "FieldMismatch"));
    if (fatal) {
      throw new Error(`CSV 解析失败：${fatal.message}`);
    }
  }

  const data = parsed.data.filter((row) =>
    Object.values(row).some((v) => v !== undefined && v !== null && String(v).trim() !== "")
  );

  if (data.length === 0) {
    const headersFromMeta = parsed.meta.fields?.filter(Boolean) as string[] | undefined;
    if (!headersFromMeta?.length) {
      throw new Error("CSV 为空或没有表头");
    }
    const fields = headersFromMeta.map((name) => buildFieldRuleFromHeader(name, ""));
    return { fields, headers: headersFromMeta, rowCountSample: 0 };
  }

  const headers = (parsed.meta.fields?.filter(Boolean) as string[]) ?? Object.keys(data[0]);
  if (!headers.length) throw new Error("未检测到表头");

  const samples = firstRowSamples(headers, data as Record<string, unknown>[]);
  const fields = headers.map((name, i) => buildFieldRuleFromHeader(name, samples[i] ?? ""));

  return { fields, headers, rowCountSample: data.length };
}

export function parseXlsxBuffer(buf: Buffer): ParsedUpload {
  const wb = XLSX.read(buf, { type: "buffer" });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) throw new Error("XLSX 中没有工作表");

  const sheet = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: false,
  });

  if (!rows.length) throw new Error("XLSX 为空或没有数据行");

  const headers = Object.keys(rows[0]).map((h) => h.trim()).filter(Boolean);
  if (!headers.length) throw new Error("未检测到表头");

  const samples = firstRowSamples(headers, rows);
  const fields = headers.map((name, i) => buildFieldRuleFromHeader(name, samples[i] ?? ""));

  return { fields, headers, rowCountSample: rows.length };
}
