import { api } from "../api.ts";
import { TokenBucket } from "../bucket.ts";
import { sleep } from "../util.ts";

function createProxy<T extends object>(target: T, bucket: TokenBucket): T {
  return new Proxy(target, {
    get(target, prop, receiver) {
      const reflectedProperty = Reflect.get(target, prop, receiver);

      // check if the property is a function
      if (typeof reflectedProperty === "function") {
        // return a new function with takes in all the arguments and returns a promise
        // that resolves when the token bucket consumes a token
        return (...args: any) =>
          new Promise((resolve) => {
            bucket.tryConsume(() =>
              // use apply to preserve the context of the function
              resolve(reflectedProperty.apply(target, args))
            );
          });
      } else {
        // else just return the property
        return reflectedProperty;
      }
    },
  });
}

// create a bucket
const bucket = new TokenBucket(5, 1000);
bucket.start();
// create the proxied api
const proxiedApi = createProxy(api, bucket);
const results: number[] = [];

// original code, but modified to use the proxied api:
// let the bucket overflow
for (let i = 0; i < 7; i++) {
  // add the result when the promise resolves
  proxiedApi.logger(i).then((result) => results.push(result));
}
await sleep(1000);
for (let i = 8; i <= 11; i++) {
  proxiedApi.logger(i).then((result) => results.push(result));
}
await sleep(3000);
bucket.stop();

console.log(`Results: ${results}`);
