import { logger } from "../util.ts";

const loggerProxy = new Proxy(logger, {
  apply(target, _thisArg, argArray) {
    console.log(`trying to call ${target} with ${argArray}`);

    return 5;
  },
});

console.log("Logger proxy");
console.log("=====================");
// access the `logger` function through the proxy
const result = loggerProxy(1);
console.log(`Result: ${result}`);
