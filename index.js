import {createExeca} from './lib/arguments/create.js';
import {mapCommandAsync, mapCommandSync} from './lib/command.js';
import {mapNode} from './lib/arguments/node.js';
import {mapScriptAsync, setScriptSync, deepScriptOptions} from './lib/script.js';

export {ExecaError, ExecaSyncError} from './lib/return/cause.js';

export const execa = createExeca(() => ({}));
export const execaSync = createExeca(() => ({isSync: true}));
export const execaCommand = createExeca(mapCommandAsync);
export const execaCommandSync = createExeca(mapCommandSync);
export const execaNode = createExeca(mapNode);
export const $ = createExeca(mapScriptAsync, {}, deepScriptOptions, setScriptSync);
