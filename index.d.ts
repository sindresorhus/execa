export type {
	StdinOption,
	StdinSyncOption,
	StdoutStderrOption,
	StdoutStderrSyncOption,
} from './types/stdio/type.js';
export type {Options, SyncOptions} from './types/arguments/options.js';
export type {Result, SyncResult} from './types/return/result.js';
export type {ResultPromise, Subprocess} from './types/subprocess/subprocess.js';
export {ExecaError, ExecaSyncError} from './types/return/final-error.js';
export type {TemplateExpression} from './types/methods/template.js';
export {execa} from './types/methods/main-async.js';
export {execaSync} from './types/methods/main-sync.js';
export {execaCommand, execaCommandSync} from './types/methods/command.js';
export {$} from './types/methods/script.js';
export {execaNode} from './types/methods/node.js';
