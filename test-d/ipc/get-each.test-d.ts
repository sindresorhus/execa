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
execa('test', {gracefulCancel: true, cancelSignal: AbortSignal.abort()}).getEachMessage();
execa('test', {} as Options).getEachMessage?.();
execa('test', {ipc: true as boolean}).getEachMessage?.();
execa('test', {ipcInput: '' as '' | undefined}).getEachMessage?.();
execa('test', {gracefulCancel: true as boolean | undefined, cancelSignal: AbortSignal.abort()}).getEachMessage?.();

expectType<undefined>(execa('test').getEachMessage);
expectType<undefined>(execa('test', {}).getEachMessage);
expectType<undefined>(execa('test', {ipc: false}).getEachMessage);
expectType<undefined>(execa('test', {ipcInput: undefined}).getEachMessage);
expectType<undefined>(execa('test', {gracefulCancel: undefined}).getEachMessage);
expectType<undefined>(execa('test', {gracefulCancel: false}).getEachMessage);
expectType<undefined>(execa('test', {ipc: false, ipcInput: ''}).getEachMessage);
expectType<undefined>(execa('test', {ipc: false, gracefulCancel: true, cancelSignal: AbortSignal.abort()}).getEachMessage);

subprocess.getEachMessage({reference: true} as const);
getEachMessage({reference: true} as const);
subprocess.getEachMessage({reference: true as boolean});
getEachMessage({reference: true as boolean});
expectError(subprocess.getEachMessage({reference: 'true'} as const));
expectError(getEachMessage({reference: 'true'} as const));
