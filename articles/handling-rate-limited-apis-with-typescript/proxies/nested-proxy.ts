import { usersApi } from "../api.ts";
import { TokenBucket } from "../bucket.ts";
import { tryConsume } from "../util.ts";
import { createProxy } from "./proxy.ts";

function createNestedProxy<T extends object>(root: T, bucket: TokenBucket): T {
	function createProxy<U extends object>(target: U): U {
		return new Proxy(target, {
			get(target, prop, receiver) {
				const reflectedProperty = Reflect.get(target, prop, receiver);

				// check if the property is an object
				if (typeof reflectedProperty === 'object' && reflectedProperty !== null) {
					// if it is an object create a new nested proxy
					return createProxy(reflectedProperty)
				}
				// check if the property is a function
				else if (typeof reflectedProperty === "function") {
					// return a new function with takes in all the arguments and returns a promise
					// that resolves when the token bucket consumes a token
					return (...args: unknown[]) => tryConsume(bucket, reflectedProperty.bind(target, ...args))
				} else {
					// else just return the property
					return reflectedProperty;
				}
			},
		});
	}

	return createProxy(root)
}

async function noNestedProxy() {
	// create a bucket
	const bucket = new TokenBucket(5, 1000);
	bucket.start();
	// create the proxied api
	const proxiedApi = createProxy(usersApi, bucket);

	const users = await proxiedApi.users.getUsers();
	console.log("Users:", users);

	console.log(`Being processed by the bucket: ${bucket.getBeingProcessed()}`)
	bucket.stop();
}

async function withNestedProxy() {
	// create a bucket
	const bucket = new TokenBucket(5, 1000);
	bucket.start();
	// create the proxied api
	const proxiedApi = createNestedProxy(usersApi, bucket);

	const users = await proxiedApi.users.getUsers();
	console.log("Users:", users);

	console.log(`Being processed by the bucket: ${bucket.getBeingProcessed()}`)
	bucket.stop();
}

if (import.meta.main) {
	console.log("Without nested proxy");
	console.log("=====================");
	await noNestedProxy();
	console.log("\nNested proxy");
	console.log("=====================");
	await withNestedProxy();
}