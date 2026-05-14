"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadZone } from "@/components/UploadZone";
import { TemplateCard } from "@/components/TemplateCard";
import type { FieldRule, Template } from "@/types";
import { DRAFT_KEY } from "@/lib/draft-key";
import { randomId } from "@/lib/utils";

export default function HomePage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshTemplates = useCallback(async () => {
    try {
      const res = await fetch("/api/templates");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "加载模板失败");
      setTemplates(data.templates as Template[]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "加载模板失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshTemplates();
  }, [refreshTemplates]);

  const onParsed = useCallback(() => {
    router.push("/template/new");
  }, [router]);

  const createEmpty = () => {
    const field: FieldRule = {
      id: randomId(),
      name: "column_1",
      type: "fixed",
      config: { value: "" },
      sample: "",
    };
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ fields: [field] }));
    router.push("/template/new");
  };

  return (
    <main className="mx-auto max-w-5xl space-y-10 px-4 py-12">
      <header className="space-y-2 text-center sm:text-left">
        <h1 className="text-3xl font-semibold tracking-tight">Mock Data Generator</h1>
        <p className="text-muted-foreground">Generate QA test data quickly</p>
      </header>

      <section id="upload" className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-medium">上传模板</h2>
            <p className="text-sm text-muted-foreground">支持 CSV / XLSX，自动识别表头与示例类型</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={createEmpty}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              新建空模板
            </Button>
          </div>
        </div>
        <UploadZone onParsed={onParsed} />
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-medium">最近模板</h2>
          <p className="text-sm text-muted-foreground">快速复用已保存的字段规则</p>
        </div>
        {loading ? (
          <p className="text-sm text-muted-foreground">加载中…</p>
        ) : templates.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">暂无模板</CardTitle>
              <CardDescription>上传文件或新建空模板后即可保存到此处</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="secondary">
                <Link href="#upload">开始上传</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                onUse={() => router.push(`/template/${t.id}`)}
                onDeleted={() => void refreshTemplates()}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
