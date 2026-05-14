/**
 * 扩展预留目录：
 * - AI 自动生成规则（可在此接入模型，输出 FieldRule[]）
 * - faker 假数据（可按 FieldType 注册自定义生成器）
 * - API token / 用户系统（与 template-storage 并行接入）
 *
 * 当前核心生成逻辑见 lib/generate-data.ts，保持单一入口便于替换。
 */
export {};
