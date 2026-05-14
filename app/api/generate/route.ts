import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import type { GenerateRequest } from "@/types";
import { generateRowsWithRng } from "@/lib/compute-values";
import { nodeRandomSource } from "@/lib/node-random";
import { rowsToCsvString } from "@/lib/text-utils";

export const runtime = "nodejs";
export const maxDuration = 120;

function validateBody(body: unknown): { ok: true; data: GenerateRequest } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "请求体无效" };
  const b = body as Record<string, unknown>;
  if (!Array.isArray(b.fields) || b.fields.length === 0) {
    return { ok: false, error: "字段列表不能为空" };
  }
  const rowCount = Number(b.rowCount);
  if (!Number.isFinite(rowCount) || rowCount < 1 || rowCount > 100_000) {
    return { ok: false, error: "行数必须在 1 ~ 100000 之间" };
  }
  const format = b.format;
  if (format !== "csv" && format !== "xlsx") {
    return { ok: false, error: "导出格式必须是 csv 或 xlsx" };
  }
  return {
    ok: true,
    data: {
      fields: b.fields as GenerateRequest["fields"],
      rowCount,
      format,
    },
  };
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON 解析失败" }, { status: 400 });
  }

  const v = validateBody(body);
  if (!v.ok) {
    return NextResponse.json({ error: v.error }, { status: 400 });
  }

  const { fields, rowCount, format } = v.data;

  try {
    const rows = generateRowsWithRng(fields, rowCount, nodeRandomSource);

    if (format === "csv") {
      const csv = rowsToCsvString(rows);
      const buffer = Buffer.from(csv, "utf8");
      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="mock-data.csv"`,
          "Content-Length": String(buffer.length),
        },
      });
    }

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "data");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "buffer" }) as Buffer;

    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="mock-data.xlsx"`,
        "Content-Length": String(buf.length),
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "导出失败";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
