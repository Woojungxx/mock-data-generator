"use client";

import { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FieldRule, FieldRuleConfig, FieldType } from "@/types";
import { computeCellValue } from "@/lib/compute-values";
import { browserRandomSource } from "@/lib/browser-random";

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: "fixed", label: "固定值" },
  { value: "increment_number", label: "数字递增" },
  { value: "increment_string", label: "字符串递增" },
  { value: "random_number", label: "随机数字" },
  { value: "random_string", label: "随机字符串" },
  { value: "uuid", label: "唯一标识（UUID）" },
  { value: "enum_random", label: "枚举随机" },
  { value: "datetime", label: "日期时间" },
];

function defaultConfig(type: FieldType, prev: FieldRule): FieldRuleConfig {
  const sample = prev.sample ?? "";
  switch (type) {
    case "fixed":
      return { value: sample || prev.config.value || "" };
    case "increment_number":
      return { start: prev.config.start ?? 1, step: prev.config.step ?? 1 };
    case "increment_string":
      return {
        prefix: prev.config.prefix ?? "device_",
        start: prev.config.start ?? 1,
        padding: prev.config.padding ?? 4,
      };
    case "random_number":
      return { min: prev.config.min ?? 0, max: prev.config.max ?? 99999 };
    case "random_string":
      return { length: prev.config.length ?? 8 };
    case "uuid":
      return {};
    case "enum_random":
      return { enumValues: prev.config.enumValues ?? (sample || "KR,US,JP") };
    case "datetime":
      return {
        startDate: prev.config.startDate ?? new Date(Date.now() - 7 * 864e5).toISOString(),
        endDate: prev.config.endDate ?? new Date().toISOString(),
      };
    default:
      return {};
  }
}

function toLocalValue(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalValue(v: string): string {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return new Date().toISOString();
  return d.toISOString();
}

type FieldRuleTableProps = {
  fields: FieldRule[];
  onChange: (next: FieldRule[]) => void;
};

export function FieldRuleTable({ fields, onChange }: FieldRuleTableProps) {
  const previews = useMemo(
    () => fields.map((f) => computeCellValue(f, 0, browserRandomSource)),
    [fields]
  );

  const patch = (id: string, patchFn: (f: FieldRule) => FieldRule) => {
    onChange(fields.map((f) => (f.id === id ? patchFn(f) : f)));
  };

  const patchConfig = (id: string, cfg: Partial<FieldRuleConfig>) => {
    patch(id, (f) => ({ ...f, config: { ...f.config, ...cfg } }));
  };

  const setType = (id: string, type: FieldType) => {
    patch(id, (f) => ({ ...f, type, config: defaultConfig(type, f) }));
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[140px]">字段名</TableHead>
            <TableHead className="min-w-[160px]">类型</TableHead>
            <TableHead className="min-w-[320px]">配置</TableHead>
            <TableHead className="min-w-[160px]">示例</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fields.map((field, idx) => (
            <TableRow key={field.id}>
              <TableCell className="align-top font-medium">{field.name}</TableCell>
              <TableCell className="align-top">
                <Select value={field.type} onValueChange={(v) => setType(field.id, v as FieldType)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="align-top">
                <ConfigEditors field={field} onPatch={(cfg) => patchConfig(field.id, cfg)} />
              </TableCell>
              <TableCell className="align-top text-xs text-muted-foreground break-all">
                {previews[idx]}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ConfigEditors({
  field,
  onPatch,
}: {
  field: FieldRule;
  onPatch: (cfg: Partial<FieldRuleConfig>) => void;
}) {
  switch (field.type) {
    case "fixed":
      return (
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">固定值</span>
          <Input
            value={field.config.value ?? ""}
            onChange={(e) => onPatch({ value: e.target.value })}
            placeholder="例如 Android"
          />
        </div>
      );
    case "increment_number":
      return (
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <span className="text-xs text-muted-foreground">起始</span>
            <Input
              type="number"
              value={field.config.start ?? 1}
              onChange={(e) => onPatch({ start: Number(e.target.value) })}
            />
          </div>
          <div>
            <span className="text-xs text-muted-foreground">步长</span>
            <Input
              type="number"
              value={field.config.step ?? 1}
              onChange={(e) => onPatch({ step: Number(e.target.value) })}
            />
          </div>
        </div>
      );
    case "increment_string":
      return (
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <span className="text-xs text-muted-foreground">prefix</span>
            <Input
              value={field.config.prefix ?? ""}
              onChange={(e) => onPatch({ prefix: e.target.value })}
              placeholder="device_"
            />
          </div>
          <div>
            <span className="text-xs text-muted-foreground">start number</span>
            <Input
              type="number"
              value={field.config.start ?? 1}
              onChange={(e) => onPatch({ start: Number(e.target.value) })}
            />
          </div>
          <div>
            <span className="text-xs text-muted-foreground">padding length</span>
            <Input
              type="number"
              min={0}
              max={32}
              value={field.config.padding ?? 4}
              onChange={(e) => onPatch({ padding: Number(e.target.value) })}
            />
          </div>
        </div>
      );
    case "random_number":
      return (
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <span className="text-xs text-muted-foreground">min</span>
            <Input
              type="number"
              value={field.config.min ?? 0}
              onChange={(e) => onPatch({ min: Number(e.target.value) })}
            />
          </div>
          <div>
            <span className="text-xs text-muted-foreground">max</span>
            <Input
              type="number"
              value={field.config.max ?? 100}
              onChange={(e) => onPatch({ max: Number(e.target.value) })}
            />
          </div>
        </div>
      );
    case "random_string":
      return (
        <div>
          <span className="text-xs text-muted-foreground">length</span>
          <Input
            type="number"
            min={1}
            max={512}
            value={field.config.length ?? 8}
            onChange={(e) => onPatch({ length: Number(e.target.value) })}
          />
        </div>
      );
    case "uuid":
      return <p className="text-xs text-muted-foreground">无需额外配置</p>;
    case "enum_random":
      return (
        <div>
          <span className="text-xs text-muted-foreground">枚举（逗号分隔）</span>
          <Input
            value={field.config.enumValues ?? ""}
            onChange={(e) => onPatch({ enumValues: e.target.value })}
            placeholder="KR,US,JP"
          />
        </div>
      );
    case "datetime":
      return (
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <span className="text-xs text-muted-foreground">start date</span>
            <Input
              type="datetime-local"
              value={toLocalValue(field.config.startDate)}
              onChange={(e) => onPatch({ startDate: fromLocalValue(e.target.value) })}
            />
          </div>
          <div>
            <span className="text-xs text-muted-foreground">end date</span>
            <Input
              type="datetime-local"
              value={toLocalValue(field.config.endDate)}
              onChange={(e) => onPatch({ endDate: fromLocalValue(e.target.value) })}
            />
          </div>
        </div>
      );
    default:
      return null;
  }
}
