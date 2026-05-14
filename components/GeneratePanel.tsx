"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FieldRule, GenerateRequest } from "@/types";

type GeneratePanelProps = {
  fields: FieldRule[];
  defaultFileName?: string;
};

export function GeneratePanel({ fields, defaultFileName }: GeneratePanelProps) {
  const [rowCount, setRowCount] = useState(100);
  const [format, setFormat] = useState<GenerateRequest["format"]>("csv");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  const valid = useMemo(() => {
    const n = Number(rowCount);
    return Number.isFinite(n) && n >= 1 && n <= 100_000;
  }, [rowCount]);

  const simulateProgress = () => {
    setProgress(8);
    const t = setInterval(() => {
      setProgress((p) => {
        if (p >= 92) return p;
        return p + Math.random() * 12;
      });
    }, 220);
    return () => clearInterval(t);
  };

  const handleGenerate = async () => {
    if (!valid) {
      toast.error("行数必须在 1 ~ 100000 之间");
      return;
    }
    if (!fields.length) {
      toast.error("没有可生成的字段");
      return;
    }
    setBusy(true);
    setProgress(0);
    const stop = simulateProgress();
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields,
          rowCount: Number(rowCount),
          format,
        } satisfies GenerateRequest),
      });
      const headerType = res.headers.get("Content-Type") ?? "";
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error ?? "生成失败");
      }
      if (!headerType.includes("text/csv") && !headerType.includes("spreadsheetml")) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error ?? "生成失败");
      }
      const blob = await res.blob();
      const ext = format === "csv" ? "csv" : "xlsx";
      const base = (defaultFileName ?? "mock-data").replace(/\.(csv|xlsx)$/i, "");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${base}-generated.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
      setProgress(100);
      toast.success("已开始下载");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "导出失败");
    } finally {
      stop();
      setBusy(false);
      setTimeout(() => setProgress(0), 400);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">生成与导出</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="rowCount">Row Count（1 ~ 100000）</Label>
            <Input
              id="rowCount"
              type="number"
              min={1}
              max={100_000}
              value={rowCount}
              onChange={(e) => setRowCount(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>Export Format</Label>
            <Select value={format} onValueChange={(v) => setFormat(v as GenerateRequest["format"])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="xlsx">XLSX</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {busy && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">正在服务端生成数据，请稍候…</p>
            <Progress value={progress} />
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button className="w-full sm:w-auto" disabled={busy} onClick={() => void handleGenerate()}>
          Generate Data
        </Button>
      </CardFooter>
    </Card>
  );
}
