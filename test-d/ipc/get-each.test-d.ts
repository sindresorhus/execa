import {expectType, expectError} from 'tsd';
import {
	getEachMessage,
	execa,
	type Message,
	type Options,
} from '../../index.js';

const subprocess = execa('test', {ipc: true});

for await (const message of subprocess.getEachMessage()) {
	expectType<Message<'advanced'>>(message);
}

for await (const message of execa('test', {ipc: true, serialization: 'json'}).getEachMessage()) {
	expectType<Message<'json'>>(message);
}

for await (const message of getEachMessage()) {
	expectType<Message>(message);
}

expectError(subprocess.getEachMessage(''));
expectError(getEachMessage(''));

execa('test', {ipcInput: ''}).getEachMessage();
execa('test', {ipcInput: '' as Message}).getEachMessage();
execa('test', {} as Options).getEachMessage?.();
execa('test', {ipc: true as boolean}).getEachMessage?.();
execa('test', {ipcInput: '' as '' | undefined}).getEachMessage?.();

expectType<undefined>(execa('test').getEachMessage);
expectType<undefined>(execa('test', {}).getEachMessage);
expectType<undefined>(execa('test', {ipc: false}).getEachMessage);
expectType<undefined>(execa('test', {ipcInput: undefined}).getEachMessage);
expectType<undefined>(execa('test', {ipc: false, ipcInput: ''}).getEachMessage);

