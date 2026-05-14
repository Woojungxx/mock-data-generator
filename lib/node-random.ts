import { randomBytes, randomInt, randomUUID } from "crypto";
import type { RandomSource } from "@/lib/compute-values";

const ALPHANUM = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export const nodeRandomSource: RandomSource = {
  intInclusive(min: number, max: number) {
    return randomInt(min, max + 1);
  },
  randomString(length: number) {
    let out = "";
    const bytes = randomBytes(length);
    for (let i = 0; i < length; i++) {
      out += ALPHANUM[bytes[i]! % ALPHANUM.length];
    }
    return out;
  },
  uuid: () => randomUUID(),
};
