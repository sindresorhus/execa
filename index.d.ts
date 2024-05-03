export type {
	StdinOption,
	StdinSyncOption,
	StdoutStderrOption,
	StdoutStderrSyncOption,
} from './types/stdio/type';
export type {Options, SyncOptions} from './types/arguments/options';
export type {Result, SyncResult} from './types/return/result';
export type {ResultPromise, Subprocess} from './types/subprocess/subprocess';
/* eslint-disable import/extensions */
export {ExecaError, ExecaSyncError} from './types/return/final-error';
export {execa} from './types/methods/main-async';
export {execaSync} from './types/methods/main-sync';
export {execaCommand, execaCommandSync} from './types/methods/command';
export {$} from './types/methods/script';
export {execaNode} from './types/methods/node';
/* eslint-enable import/extensions */
