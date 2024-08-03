import path from 'node:path';

export const getAbsolutePath = file => ({file});
export const getRelativePath = filePath => ({file: path.relative('.', filePath)});
