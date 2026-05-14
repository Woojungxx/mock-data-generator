"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { FieldRuleTable } from "@/components/FieldRuleTable";
import { GeneratePanel } from "@/components/GeneratePanel";
import type { FieldRule, Template } from "@/types";
import { DRAFT_KEY } from "@/lib/draft-key";

type TemplateEditorProps = {
  id: string;
};

export function TemplateEditor({ id }: TemplateEditorProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [fields, setFields] = useState<FieldRule[]>([]);
  const [templateMeta, setTemplateMeta] = useState<Partial<Template>>({});
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      try {
        if (id === "new") {
          const raw = sessionStorage.getItem(DRAFT_KEY);
          if (!raw) {
            toast.error("未找到上传草稿，请先在首页上传模板");
            router.replace("/");
            return;
          }
          const draft = JSON.parse(raw) as { fileName?: string; fields?: FieldRule[] };
          if (!draft.fields || !Array.isArray(draft.fields) || draft.fields.length === 0) {
            toast.error("草稿无效");
            router.replace("/");
            return;
          }
          if (!cancelled) {
            setFields(draft.fields);
            setTemplateMeta({
              originalFileName: draft.fileName,
            });
            setSaveName(
              draft.fileName
                ? draft.fileName.replace(/\.(csv|xlsx)$/i, "")
                : "未命名模板"
            );
          }
          return;
        }

        const res = await fetch(`/api/templates/${id}`);
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error ?? "加载模板失败");
          router.replace("/");
          return;
        }
        const t = data.template as Template;
        if (!cancelled) {
          setFields(t.fields);
          setTemplateMeta(t);
          setSaveName(t.name);
        }
      } catch {
        toast.error("加载失败");
        router.replace("/");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [id, router]);

  const handleSave = async () => {
    const name = saveName.trim();
    if (!name) {
      toast.error("请填写模板名称");
      return;
    }
    setSaving(true);
    try {
      const body: Partial<Template> = {
        id: id !== "new" ? id : undefined,
        name,
        fields,
        originalFileName: templateMeta.originalFileName,
        createdAt: templateMeta.createdAt,
      };
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "保存失败");
      const saved = data.template as Template;
      toast.success("模板已保存");
      setSaveOpen(false);
      setTemplateMeta(saved);
      if (id === "new") {
        sessionStorage.removeItem(DRAFT_KEY);
        router.replace(`/template/${saved.id}`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-sm text-muted-foreground">加载中…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link href="/">
              <ArrowLeft className="mr-1 h-4 w-4" />
              返回首页
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">字段配置</h1>
          <p className="text-sm text-muted-foreground">
            {templateMeta.originalFileName
              ? `来源：${templateMeta.originalFileName}`
              : "为每个字段设置生成规则"}
          </p>
        </div>
        <Button onClick={() => setSaveOpen(true)}>
          <Save className="mr-2 h-4 w-4" />
          保存模板
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">规则表</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldRuleTable fields={fields} onChange={setFields} />
        </CardContent>
      </Card>

      <GeneratePanel fields={fields} defaultFileName={templateMeta.originalFileName} />

      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>保存模板</DialogTitle>
            <DialogDescription>模板将保存到服务器本地文件 data/templates.json</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="tpl-name">模板名称</Label>
            <Input id="tpl-name" value={saveName} onChange={(e) => setSaveName(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveOpen(false)}>
              取消
            </Button>
            <Button disabled={saving} onClick={() => void handleSave()}>
              {saving ? "保存中…" : "确认保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
