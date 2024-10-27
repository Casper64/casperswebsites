import type { Consumer, TokenBucket } from "./bucket.ts";

export function logger(number: number) {
  const now = new Date();
  console.log(
    `Processing ${number} at ${now.getSeconds()}:${now.getMilliseconds()}`
  );

  return number;
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}


export function tryConsume<T>(bucket: TokenBucket, consumer: Consumer<T>): Promise<T> {
  return new Promise((resolve) => {
    bucket.tryConsume(() => resolve(consumer()));
  });
}