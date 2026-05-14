"use client";

import { Trash2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Template } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";

type TemplateCardProps = {
  template: Template;
  onUse: (t: Template) => void;
  onDeleted: () => void;
};

export function TemplateCard({ template, onUse, onDeleted }: TemplateCardProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fmt = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch {
      return iso;
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/templates/${template.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "删除失败");
      }
      setOpen(false);
      onDeleted();
    } catch (e) {
      alert(e instanceof Error ? e.message : "删除失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card className="flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{template.name}</CardTitle>
          <p className="text-xs text-muted-foreground">更新于 {fmt(template.updatedAt)}</p>
        </CardHeader>
        <CardContent className="flex-1 pb-2 text-xs text-muted-foreground">
          {template.originalFileName ? <p>来源文件：{template.originalFileName}</p> : <p>共 {template.fields.length} 个字段</p>}
        </CardContent>
        <CardFooter className="flex gap-2 pt-0">
          <Button className="flex-1" size="sm" onClick={() => onUse(template)}>
            <Play className="mr-1 h-3 w-3" />
            使用
          </Button>
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除模板？</DialogTitle>
            <DialogDescription>此操作无法撤销。</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" disabled={loading} onClick={() => void handleDelete()}>
              {loading ? "删除中…" : "删除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
