import { NextResponse } from "next/server";
import { deleteTemplate, getTemplate } from "@/lib/template-storage";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const template = await getTemplate(id);
    if (!template) {
      return NextResponse.json({ error: "模板不存在" }, { status: 404 });
    }
    return NextResponse.json({ template });
  } catch {
    return NextResponse.json({ error: "读取模板失败" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const ok = await deleteTemplate(id);
    if (!ok) {
      return NextResponse.json({ error: "模板不存在" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
