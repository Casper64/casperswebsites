import { logger } from "./util.ts";

// sample api instance
export const api = {
  async logger(n: number) {
    return logger(n);
  },
};

export const usersApi = {
  users: {
    async getUsers() {
      console.log("Retrieving users...");
      return [{ id: "test", name: "user" }]
    }
  }
};