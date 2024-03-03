import {hrtime} from 'node:process';

export const getStartTime = () => hrtime.bigint();

export const getDurationMs = startTime => Number(hrtime.bigint() - startTime) / 1e6;
