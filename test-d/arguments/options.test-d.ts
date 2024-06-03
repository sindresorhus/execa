import * as process from 'node:process';
import {expectError, expectAssignable, expectNotAssignable} from 'tsd';
import {
	execa,
	execaSync,
	type Options,
	type SyncOptions,
} from '../../index.js';

const fileUrl = new URL('file:///test');

expectAssignable<Options>({preferLocal: false});
expectAssignable<Options>({cleanup: false});
expectNotAssignable<Options>({other: false});
expectAssignable<SyncOptions>({preferLocal: false});
expectNotAssignable<SyncOptions>({cleanup: false});
expectNotAssignable<SyncOptions>({other: false});

await execa('unicorns', {preferLocal: false});
execaSync('unicorns', {preferLocal: false});
expectError(await execa('unicorns', {preferLocal: 'false'}));
expectError(execaSync('unicorns', {preferLocal: 'false'}));

await execa('unicorns', {localDir: '.'});
execaSync('unicorns', {localDir: '.'});
await execa('unicorns', {localDir: fileUrl});
execaSync('unicorns', {localDir: fileUrl});
expectError(await execa('unicorns', {localDir: false}));
expectError(execaSync('unicorns', {localDir: false}));

await execa('unicorns', {node: true});
execaSync('unicorns', {node: true});
expectError(await execa('unicorns', {node: 'true'}));
expectError(execaSync('unicorns', {node: 'true'}));

await execa('unicorns', {nodePath: './node'});
execaSync('unicorns', {nodePath: './node'});
await execa('unicorns', {nodePath: fileUrl});
execaSync('unicorns', {nodePath: fileUrl});
expectError(await execa('unicorns', {nodePath: false}));
expectError(execaSync('unicorns', {nodePath: false}));

await execa('unicorns', {nodeOptions: ['--async-stack-traces'] as const});
execaSync('unicorns', {nodeOptions: ['--async-stack-traces'] as const});
expectError(await execa('unicorns', {nodeOptions: [false] as const}));
expectError(execaSync('unicorns', {nodeOptions: [false] as const}));

await execa('unicorns', {input: ''});
execaSync('unicorns', {input: ''});
await execa('unicorns', {input: new Uint8Array()});
execaSync('unicorns', {input: new Uint8Array()});
await execa('unicorns', {input: process.stdin});
execaSync('unicorns', {input: process.stdin});
expectError(await execa('unicorns', {input: false}));
expectError(execaSync('unicorns', {input: false}));

await execa('unicorns', {inputFile: ''});
execaSync('unicorns', {inputFile: ''});
await execa('unicorns', {inputFile: fileUrl});
execaSync('unicorns', {inputFile: fileUrl});
expectError(await execa('unicorns', {inputFile: false}));
expectError(execaSync('unicorns', {inputFile: false}));

await execa('unicorns', {lines: false});
execaSync('unicorns', {lines: false});
expectError(await execa('unicorns', {lines: 'false'}));
expectError(execaSync('unicorns', {lines: 'false'}));

await execa('unicorns', {reject: false});
execaSync('unicorns', {reject: false});
expectError(await execa('unicorns', {reject: 'false'}));
expectError(execaSync('unicorns', {reject: 'false'}));

await execa('unicorns', {stripFinalNewline: false});
execaSync('unicorns', {stripFinalNewline: false});
expectError(await execa('unicorns', {stripFinalNewline: 'false'}));
expectError(execaSync('unicorns', {stripFinalNewline: 'false'}));

await execa('unicorns', {extendEnv: false});
execaSync('unicorns', {extendEnv: false});
expectError(await execa('unicorns', {extendEnv: 'false'}));
expectError(execaSync('unicorns', {extendEnv: 'false'}));

await execa('unicorns', {cwd: '.'});
execaSync('unicorns', {cwd: '.'});
await execa('unicorns', {cwd: fileUrl});
execaSync('unicorns', {cwd: fileUrl});
expectError(await execa('unicorns', {cwd: false}));
expectError(execaSync('unicorns', {cwd: false}));

/* eslint-disable @typescript-eslint/naming-convention */
await execa('unicorns', {env: {PATH: ''}});
execaSync('unicorns', {env: {PATH: ''}});
/* eslint-enable @typescript-eslint/naming-convention */
expectError(await execa('unicorns', {env: false}));
expectError(execaSync('unicorns', {env: false}));

await execa('unicorns', {argv0: ''});
execaSync('unicorns', {argv0: ''});
expectError(await execa('unicorns', {argv0: false}));
expectError(execaSync('unicorns', {argv0: false}));

await execa('unicorns', {uid: 0});
execaSync('unicorns', {uid: 0});
expectError(await execa('unicorns', {uid: '0'}));
expectError(execaSync('unicorns', {uid: '0'}));

await execa('unicorns', {gid: 0});
execaSync('unicorns', {gid: 0});
expectError(await execa('unicorns', {gid: '0'}));
expectError(execaSync('unicorns', {gid: '0'}));

await execa('unicorns', {shell: true});
execaSync('unicorns', {shell: true});
await execa('unicorns', {shell: '/bin/sh'});
execaSync('unicorns', {shell: '/bin/sh'});
await execa('unicorns', {shell: fileUrl});
execaSync('unicorns', {shell: fileUrl});
expectError(await execa('unicorns', {shell: {}}));
expectError(execaSync('unicorns', {shell: {}}));

await execa('unicorns', {timeout: 1000});
execaSync('unicorns', {timeout: 1000});
expectError(await execa('unicorns', {timeout: '1000'}));
expectError(execaSync('unicorns', {timeout: '1000'}));

await execa('unicorns', {maxBuffer: 1000});
execaSync('unicorns', {maxBuffer: 1000});
expectError(await execa('unicorns', {maxBuffer: '1000'}));
expectError(execaSync('unicorns', {maxBuffer: '1000'}));

await execa('unicorns', {killSignal: 'SIGTERM'});
execaSync('unicorns', {killSignal: 'SIGTERM'});
await execa('unicorns', {killSignal: 9});
execaSync('unicorns', {killSignal: 9});
expectError(await execa('unicorns', {killSignal: false}));
expectError(execaSync('unicorns', {killSignal: false}));
expectError(await execa('unicorns', {killSignal: 'Sigterm'}));
expectError(execaSync('unicorns', {killSignal: 'Sigterm'}));
expectError(await execa('unicorns', {killSignal: 'sigterm'}));
expectError(execaSync('unicorns', {killSignal: 'sigterm'}));
expectError(await execa('unicorns', {killSignal: 'SIGOTHER'}));
expectError(execaSync('unicorns', {killSignal: 'SIGOTHER'}));
expectError(await execa('unicorns', {killSignal: 'SIGEMT'}));
expectError(execaSync('unicorns', {killSignal: 'SIGEMT'}));
expectError(await execa('unicorns', {killSignal: 'SIGCLD'}));
expectError(execaSync('unicorns', {killSignal: 'SIGCLD'}));
expectError(await execa('unicorns', {killSignal: 'SIGRT1'}));
expectError(execaSync('unicorns', {killSignal: 'SIGRT1'}));

await execa('unicorns', {forceKillAfterDelay: false});
expectError(execaSync('unicorns', {forceKillAfterDelay: false}));
await execa('unicorns', {forceKillAfterDelay: 42});
expectError(execaSync('unicorns', {forceKillAfterDelay: 42}));
expectError(await execa('unicorns', {forceKillAfterDelay: 'true'}));
expectError(execaSync('unicorns', {forceKillAfterDelay: 'true'}));

await execa('unicorns', {windowsVerbatimArguments: true});
execaSync('unicorns', {windowsVerbatimArguments: true});
expectError(await execa('unicorns', {windowsVerbatimArguments: 'true'}));
expectError(execaSync('unicorns', {windowsVerbatimArguments: 'true'}));

await execa('unicorns', {windowsHide: false});
execaSync('unicorns', {windowsHide: false});
expectError(await execa('unicorns', {windowsHide: 'false'}));
expectError(execaSync('unicorns', {windowsHide: 'false'}));

await execa('unicorns', {verbose: 'none'});
execaSync('unicorns', {verbose: 'none'});
await execa('unicorns', {verbose: 'short'});
execaSync('unicorns', {verbose: 'short'});
await execa('unicorns', {verbose: 'full'});
execaSync('unicorns', {verbose: 'full'});
expectError(await execa('unicorns', {verbose: 'other'}));
expectError(execaSync('unicorns', {verbose: 'other'}));

await execa('unicorns', {cleanup: false});
expectError(execaSync('unicorns', {cleanup: false}));
expectError(await execa('unicorns', {cleanup: 'false'}));
expectError(execaSync('unicorns', {cleanup: 'false'}));

await execa('unicorns', {buffer: false});
execaSync('unicorns', {buffer: false});
expectError(await execa('unicorns', {buffer: 'false'}));
expectError(execaSync('unicorns', {buffer: 'false'}));

await execa('unicorns', {all: true});
execaSync('unicorns', {all: true});
expectError(await execa('unicorns', {all: 'true'}));
expectError(execaSync('unicorns', {all: 'true'}));

await execa('unicorns', {ipc: true});
expectError(execaSync('unicorns', {ipc: true}));
expectError(await execa('unicorns', {ipc: 'true'}));
expectError(execaSync('unicorns', {ipc: 'true'}));

await execa('unicorns', {serialization: 'json'});
expectError(execaSync('unicorns', {serialization: 'json'}));
await execa('unicorns', {serialization: 'advanced'});
expectError(execaSync('unicorns', {serialization: 'advanced'}));
expectError(await execa('unicorns', {serialization: 'other'}));
expectError(execaSync('unicorns', {serialization: 'other'}));

await execa('unicorns', {ipcInput: ''});
expectError(execaSync('unicorns', {ipcInput: ''}));
await execa('unicorns', {ipcInput: {}});
expectError(execaSync('unicorns', {ipcInput: {}}));
await execa('unicorns', {ipcInput: undefined});
execaSync('unicorns', {ipcInput: undefined});
expectError(await execa('unicorns', {ipcInput: 0n}));
expectError(execaSync('unicorns', {ipcInput: 0n}));

await execa('unicorns', {detached: true});
expectError(execaSync('unicorns', {detached: true}));
expectError(await execa('unicorns', {detached: 'true'}));
expectError(execaSync('unicorns', {detached: 'true'}));

await execa('unicorns', {cancelSignal: AbortSignal.abort()});
expectError(execaSync('unicorns', {cancelSignal: AbortSignal.abort()}));
expectError(await execa('unicorns', {cancelSignal: false}));
expectError(execaSync('unicorns', {cancelSignal: false}));

await execa('unicorns', {gracefulCancel: true, cancelSignal: AbortSignal.abort()});
expectError(execaSync('unicorns', {gracefulCancel: true, cancelSignal: AbortSignal.abort()}));
expectError(await execa('unicorns', {gracefulCancel: 'true', cancelSignal: AbortSignal.abort()}));
expectError(execaSync('unicorns', {gracefulCancel: 'true', cancelSignal: AbortSignal.abort()}));
