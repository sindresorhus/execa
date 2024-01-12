import {execa, execaSync, $} from '../../index.js';

export const runExeca = (file, options) => execa(file, options);
export const runExecaSync = (file, options) => execaSync(file, options);
export const runScript = (file, options) => $(options)`${file}`;
export const runScriptSync = (file, options) => $(options).sync`${file}`;
