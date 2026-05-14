/** 字段生成规则类型（后续可扩展 faker / AI 等） */
export type FieldType =
  | "fixed"
  | "increment_number"
  | "increment_string"
  | "random_number"
  | "random_string"
  | "uuid"
  | "enum_random"
  | "datetime";

/** 各类型共用的扁平配置（便于 JSON 序列化与表单绑定） */
export interface FieldRuleConfig {
  /** fixed */
  value?: string;
  /** increment_number */
  start?: number;
  step?: number;
  /** increment_string */
  prefix?: string;
  padding?: number;
  /** random_number */
  min?: number;
  max?: number;
  /** random_string */
  length?: number;
  /** enum_random — 逗号分隔 */
  enumValues?: string;
  /** datetime — ISO 日期字符串 */
  startDate?: string;
  endDate?: string;
}

export interface FieldRule {
  id: string;
  name: string;
  type: FieldType;
  config: FieldRuleConfig;
  /** 上传时首行示例，用于推断与展示 */
  sample?: string;
}

export interface Template {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  fields: FieldRule[];
  originalFileName?: string;
}

export interface TemplatesFile {
  templates: Template[];
}

export interface GenerateRequest {
  fields: FieldRule[];
  rowCount: number;
  format: "csv" | "xlsx";
}

/** 预留：后续 AI 规则、faker、鉴权等扩展点 */
export interface AppExtensionContext {
  /** 例如未来注入 API token */
  apiToken?: string;
  /** 例如未来启用 faker 提供器 */
  useFaker?: boolean;
}
