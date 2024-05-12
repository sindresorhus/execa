import {expectType, expectError} from 'tsd';
import {
	getOneMessage,
	execa,
	type Message,
	type Options,
} from '../../index.js';

expectType<Promise<Message>>(getOneMessage());
expectError(await getOneMessage(''));

const subprocess = execa('test', {ipc: true});
expectType<Message<'advanced'>>(await subprocess.getOneMessage());
expectType<Message<'json'>>(await execa('test', {ipc: true, serialization: 'json'}).getOneMessage());

expectError(await subprocess.getOneMessage(''));

await execa('test', {ipcInput: ''}).getOneMessage();
await execa('test', {ipcInput: '' as Message}).getOneMessage();
await execa('test', {} as Options).getOneMessage?.();
await execa('test', {ipc: true as boolean}).getOneMessage?.();
await execa('test', {ipcInput: '' as '' | undefined}).getOneMessage?.();

expectType<undefined>(execa('test').getOneMessage);
expectType<undefined>(execa('test', {}).getOneMessage);
expectType<undefined>(execa('test', {ipc: false}).getOneMessage);
expectType<undefined>(execa('test', {ipcInput: undefined}).getOneMessage);
expectType<undefined>(execa('test', {ipc: false, ipcInput: ''}).getOneMessage);
