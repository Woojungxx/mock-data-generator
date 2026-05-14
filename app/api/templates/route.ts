import { NextResponse } from "next/server";
import { listTemplates, saveTemplate } from "@/lib/template-storage";
import type { Template } from "@/types";
import { randomId } from "@/lib/utils";

export const runtime = "nodejs";

export async function GET() {
  try {
    const templates = await listTemplates();
    return NextResponse.json({ templates });
  } catch {
    return NextResponse.json({ error: "读取模板失败" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON 解析失败" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "请求体无效" }, { status: 400 });
  }

  const b = body as Partial<Template>;
  if (!b.name || typeof b.name !== "string") {
    return NextResponse.json({ error: "模板名称必填" }, { status: 400 });
  }
  if (!Array.isArray(b.fields) || b.fields.length === 0) {
    return NextResponse.json({ error: "字段规则不能为空" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const id = typeof b.id === "string" && b.id ? b.id : randomId();
  const template: Template = {
    id,
    name: b.name.trim(),
    fields: b.fields as Template["fields"],
    originalFileName: typeof b.originalFileName === "string" ? b.originalFileName : undefined,
    createdAt: typeof b.createdAt === "string" ? b.createdAt : now,
    updatedAt: now,
  };

  try {
    const saved = await saveTemplate(template);
    return NextResponse.json({ template: saved });
  } catch {
    return NextResponse.json({ error: "保存模板失败" }, { status: 500 });
  }
}
