import type { RandomSource } from "@/lib/compute-values";

const ALPHANUM = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/** 浏览器预览用随机源（与 Node 端统计特性不同，仅用于界面示例） */
export const browserRandomSource: RandomSource = {
  intInclusive(min: number, max: number) {
    const lo = Math.ceil(Math.min(min, max));
    const hi = Math.floor(Math.max(min, max));
    if (hi < lo) return lo;
    return Math.floor(Math.random() * (hi - lo + 1)) + lo;
  },
  randomString(length: number) {
    let out = "";
    for (let i = 0; i < length; i++) {
      out += ALPHANUM[Math.floor(Math.random() * ALPHANUM.length)]!;
    }
    return out;
  },
  uuid: () => {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  },
};
