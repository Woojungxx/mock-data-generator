import { promises as fs } from "fs";
import path from "path";
import type { Template, TemplatesFile } from "@/types";

const DATA_REL = ["data", "templates.json"];

export function templatesFilePath(): string {
  return path.join(process.cwd(), ...DATA_REL);
}

async function readFile(): Promise<TemplatesFile> {
  const p = templatesFilePath();
  try {
    const raw = await fs.readFile(p, "utf8");
    const data = JSON.parse(raw) as TemplatesFile;
    if (!data || !Array.isArray(data.templates)) {
      return { templates: [] };
    }
    return data;
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    if (err.code === "ENOENT") return { templates: [] };
    throw e;
  }
}

async function writeFile(data: TemplatesFile): Promise<void> {
  const p = templatesFilePath();
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, JSON.stringify(data, null, 2), "utf8");
}

export async function listTemplates(): Promise<Template[]> {
  const { templates } = await readFile();
  return [...templates].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export async function getTemplate(id: string): Promise<Template | null> {
  const { templates } = await readFile();
  return templates.find((t) => t.id === id) ?? null;
}

export async function saveTemplate(template: Template): Promise<Template> {
  const data = await readFile();
  const idx = data.templates.findIndex((t) => t.id === template.id);
  const now = new Date().toISOString();
  const toSave: Template = {
    ...template,
    updatedAt: now,
    createdAt: template.createdAt || now,
  };
  if (idx >= 0) data.templates[idx] = toSave;
  else data.templates.push(toSave);
  await writeFile(data);
  return toSave;
}

export async function deleteTemplate(id: string): Promise<boolean> {
  const data = await readFile();
  const next = data.templates.filter((t) => t.id !== id);
  if (next.length === data.templates.length) return false;
  await writeFile({ templates: next });
  return true;
}
