import isInCi from 'is-in-ci';

export const PARALLEL_COUNT = isInCi ? 10 : 100;
