import { logger } from "./util.ts";

// sample api instance
export const api = {
  async logger(n: number) {
    return logger(n);
  },
};
