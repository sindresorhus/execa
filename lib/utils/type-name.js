// Like `typeof`, but `null` is reported as `null` instead of `object`, so error messages name the actual value
export const getTypeName = value => value === null ? 'null' : typeof value;
