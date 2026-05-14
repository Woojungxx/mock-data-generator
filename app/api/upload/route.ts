import { NextResponse } from "next/server";
import { parseCsvBuffer, parseXlsxBuffer } from "@/lib/parse-file";

export const runtime = "nodejs";

const ALLOWED = new Set(["text/csv", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]);

function extFromName(name: string): "csv" | "xlsx" | null {
  const lower = name.toLowerCase();
  if (lower.endsWith(".csv")) return "csv";
  if (lower.endsWith(".xlsx")) return "xlsx";
  return null;
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "请上传文件" }, { status: 400 });
    }
    if (file.size === 0) {
      return NextResponse.json({ error: "文件为空" }, { status: 400 });
    }

    const ext = extFromName(file.name);
    if (!ext) {
      return NextResponse.json({ error: "仅支持 CSV 或 XLSX" }, { status: 400 });
    }

    const mime = file.type;
    if (mime && !ALLOWED.has(mime) && ext === "csv" && !mime.includes("csv")) {
      /* 某些浏览器 CSV MIME 不稳定，仍以扩展名为准 */
    }

    const buf = Buffer.from(await file.arrayBuffer());

    let parsed;
    try {
      parsed = ext === "csv" ? parseCsvBuffer(buf) : parseXlsxBuffer(buf);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "解析失败";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    return NextResponse.json({
      fileName: file.name,
      fields: parsed.fields,
      headers: parsed.headers,
      sampleRowCount: parsed.rowCountSample,
    });
  } catch {
    return NextResponse.json({ error: "上传处理失败" }, { status: 500 });
  }
}
