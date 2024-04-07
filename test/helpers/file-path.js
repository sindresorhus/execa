import {relative} from 'node:path';

export const getAbsolutePath = file => ({file});
export const getRelativePath = filePath => ({file: relative('.', filePath)});
