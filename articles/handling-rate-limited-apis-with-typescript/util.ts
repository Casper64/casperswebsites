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
