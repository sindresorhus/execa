import {createExeca} from './lib/methods/create.js';
import {mapCommandAsync, mapCommandSync} from './lib/methods/command.js';
import {mapNode} from './lib/methods/node.js';
import {mapScriptAsync, setScriptSync, deepScriptOptions} from './lib/methods/script.js';

export {ExecaError, ExecaSyncError} from './lib/return/final-error.js';

export const execa = createExeca(() => ({}));
export const execaSync = createExeca(() => ({isSync: true}));
export const execaCommand = createExeca(mapCommandAsync);
export const execaCommandSync = createExeca(mapCommandSync);
export const execaNode = createExeca(mapNode);
export const $ = createExeca(mapScriptAsync, {}, deepScriptOptions, setScriptSync);
