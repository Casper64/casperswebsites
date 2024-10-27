import { TokenBucket } from "./bucket.ts";
import { logger, sleep } from "./util.ts";

function tryConsume<T>(bucket: TokenBucket, consumer: () => T): Promise<T> {
  return new Promise((resolve) => {
    bucket.tryConsume(() => resolve(consumer()));
  });
}

async function simple() {
  // process max. 5 tokens per second
  const bucket = new TokenBucket(5, 1000);
  bucket.start();

  for (let i = 1; i <= 7; i++) {
    bucket.tryConsume(() => logger(i));
  }

  await sleep(1000);

  for (let i = 8; i <= 11; i++) {
    bucket.tryConsume(() => logger(i));
  }

  await sleep(3000);
  bucket.stop();
}

async function withReturn() {
  // process max. 5 tokens per second
  const bucket = new TokenBucket(5, 1000);
  bucket.start();

  const start = new Date();
  console.log(
    `Trying to consume at ${start.getSeconds()}:${start.getMilliseconds()}`
  );
  // const result = await new Promise((resolve) =>
  //     bucket.tryConsume(() => resolve(logger(1)))
  // );
  const result = await tryConsume(bucket, () => logger(1));
  console.log(`Result: ${result}`);

  const end = new Date();
  console.log(`Consumed at ${end.getSeconds()}:${end.getMilliseconds()}`);

  bucket.stop();
}

async function returnWithDelays() {
  // process max. 5 tokens per second
  const bucket = new TokenBucket(5, 1000);
  bucket.start();

  for (let i = 1; i <= 5; i++) {
    bucket.tryConsume(() => logger(i));
  }

  const start = new Date();
  console.log(
    `Trying to consume at ${start.getSeconds()}:${start.getMilliseconds()}`
  );
  // const result = await new Promise((resolve) =>
  //     bucket.tryConsume(() => resolve(logger(6)))
  // );
  const result = await tryConsume(bucket, () => logger(6));
  console.log(`Result: ${result}`);

  const end = new Date();
  console.log(`Consumed at ${end.getSeconds()}:${end.getMilliseconds()}`);

  bucket.stop();
}

console.log("simple");
console.log("=====================");
await simple();
console.log("\nwithReturn");
console.log("=====================");
await withReturn();
console.log("\nreturnWithDelays");
console.log("=====================");
await returnWithDelays();
