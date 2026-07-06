// The return value is a native Promise with Execa-specific properties.
export const mergePromise = (promise, properties) => Object.assign(promise, properties);
