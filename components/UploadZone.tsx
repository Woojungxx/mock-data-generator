"use client";

import { useCallback, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { DRAFT_KEY } from "@/lib/draft-key";

type DraftPayload = {
  fileName?: string;
  fields: unknown;
};

type UploadZoneProps = {
  onParsed: (payload: { fileName: string; fields: unknown }) => void;
  disabled?: boolean;
};

export function UploadZone({ onParsed, disabled }: UploadZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      if (disabled) return;
      const lower = file.name.toLowerCase();
      if (!lower.endsWith(".csv") && !lower.endsWith(".xlsx")) {
        toast.error("仅支持 CSV 或 XLSX");
        return;
      }
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error ?? "上传失败");
          return;
        }
        const draft: DraftPayload = { fileName: data.fileName, fields: data.fields };
        sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
        onParsed({ fileName: data.fileName, fields: data.fields });
        toast.success("已解析表头");
      } catch {
        toast.error("网络错误，上传失败");
      }
    },
    [disabled, onParsed]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files?.[0];
      if (f) void uploadFile(f);
    },
    [uploadFile]
  );

  return (
    <Card>
      <CardContent className="p-6">
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed px-6 py-14 text-center transition-colors",
            dragOver ? "border-primary bg-muted/40" : "border-muted-foreground/25 hover:bg-muted/30",
            disabled && "pointer-events-none opacity-60"
          )}
        >
          <Upload className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm font-medium">拖拽 CSV / XLSX 到此处，或点击选择文件</p>
          <p className="mt-1 text-xs text-muted-foreground">解析后将自动跳转到字段配置页</p>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
            className="hidden"
            disabled={disabled}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void uploadFile(f);
              e.target.value = "";
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
