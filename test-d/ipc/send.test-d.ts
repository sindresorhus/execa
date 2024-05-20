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
await execa('test', {} as Options).sendMessage?.('');
await execa('test', {ipc: true as boolean}).sendMessage?.('');
await execa('test', {ipcInput: '' as '' | undefined}).sendMessage?.('');

expectType<undefined>(execa('test').sendMessage);
expectType<undefined>(execa('test', {}).sendMessage);
expectType<undefined>(execa('test', {ipc: false}).sendMessage);
expectType<undefined>(execa('test', {ipcInput: undefined}).sendMessage);
expectType<undefined>(execa('test', {ipc: false, ipcInput: ''}).sendMessage);
