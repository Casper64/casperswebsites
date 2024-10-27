import { api } from "../api.ts";

// create a proxy to our api
const proxiedApi = new Proxy(api, {
  get(target, prop, receiver) {
    console.log(`Trying to access ${prop.toString()}`);
    // use the `Reflect` namespace to access the property on the target object
    // somewhat similair to doing `target[prop]`
    return Reflect.get(target, prop, receiver);
  },
  apply(target, _thisArg, argArray) {
    console.log(`trying to call ${target} with ${argArray}`);

    // return a different response
    return 5;
  },
});

console.log("Simple proxy");
console.log("=====================");
// access the `logger` function through the proxied object
const result = proxiedApi.logger(1);
console.log(`Result: ${result}`);
