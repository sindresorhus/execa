import {expectType, expectError} from 'tsd';
import {
	sendMessage,
	execa,
	type Message,
	type Options,
} from '../../index.js';

const subprocess = execa('test', {ipc: true});
expectType<void>(await subprocess.sendMessage(''));
expectType<Promise<void>>(sendMessage(''));

expectError(await subprocess.sendMessage());
expectError(await sendMessage());
expectError(await subprocess.sendMessage(undefined));
expectError(await sendMessage(undefined));
expectError(await subprocess.sendMessage(0n));
expectError(await sendMessage(0n));
expectError(await subprocess.sendMessage(Symbol('test')));
expectError(await sendMessage(Symbol('test')));

await execa('test', {ipcInput: ''}).sendMessage('');
await execa('test', {ipcInput: '' as Message}).sendMessage('');
await execa('test', {gracefulCancel: true, cancelSignal: AbortSignal.abort()}).sendMessage('');
await execa('test', {} as Options).sendMessage?.('');
await execa('test', {ipc: true as boolean}).sendMessage?.('');
await execa('test', {ipcInput: '' as '' | undefined}).sendMessage?.('');
await execa('test', {gracefulCancel: true as boolean | undefined, cancelSignal: AbortSignal.abort()}).sendMessage?.('');

expectType<undefined>(execa('test').sendMessage);
expectType<undefined>(execa('test', {}).sendMessage);
expectType<undefined>(execa('test', {ipc: false}).sendMessage);
expectType<undefined>(execa('test', {ipcInput: undefined}).sendMessage);
expectType<undefined>(execa('test', {gracefulCancel: undefined}).sendMessage);
expectType<undefined>(execa('test', {gracefulCancel: false}).sendMessage);
expectType<undefined>(execa('test', {ipc: false, ipcInput: ''}).sendMessage);
expectType<undefined>(execa('test', {ipc: false, gracefulCancel: true, cancelSignal: AbortSignal.abort()}).sendMessage);

await subprocess.sendMessage('', {} as const);
await sendMessage('', {} as const);
await subprocess.sendMessage('', {strict: true} as const);
await sendMessage('', {strict: true} as const);
expectError(await subprocess.sendMessage('', true));
expectError(await sendMessage('', true));
expectError(await subprocess.sendMessage('', {strict: 'true'}));
expectError(await sendMessage('', {strict: 'true'}));
expectError(await subprocess.sendMessage('', {unknown: true}));
expectError(await sendMessage('', {unknown: true}));
expectError(await subprocess.sendMessage('', {strict: true}, {}));
expectError(await sendMessage('', {strict: true}, {}));
