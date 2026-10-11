import {expectTypeOf, expectError} from 'nz';
import {
	getEachMessage,
	execa,
	type Message,
	type Options,
} from '../../index.js';

const subprocess = execa('test', {ipc: true});

for await (const message of subprocess.getEachMessage()) {
	expectTypeOf(message).toBe<Message<'advanced'>>();
}

for await (const message of execa('test', {ipc: true, serialization: 'json'}).getEachMessage()) {
	expectTypeOf(message).toBe<Message<'json'>>();
}

for await (const message of getEachMessage()) {
	expectTypeOf(message).toBe<Message>();
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

expectTypeOf(execa('test').getEachMessage).toBe<undefined>();
expectTypeOf(execa('test', {}).getEachMessage).toBe<undefined>();
expectTypeOf(execa('test', {ipc: false}).getEachMessage).toBe<undefined>();
expectTypeOf(execa('test', {ipcInput: undefined}).getEachMessage).toBe<undefined>();
expectTypeOf(execa('test', {gracefulCancel: undefined}).getEachMessage).toBe<undefined>();
expectTypeOf(execa('test', {gracefulCancel: false}).getEachMessage).toBe<undefined>();
expectTypeOf(execa('test', {ipc: false, ipcInput: ''}).getEachMessage).toBe<undefined>();
expectTypeOf(execa('test', {ipc: false, gracefulCancel: true, cancelSignal: AbortSignal.abort()}).getEachMessage).toBe<undefined>();

subprocess.getEachMessage({reference: true} as const);
getEachMessage({reference: true} as const);
subprocess.getEachMessage({reference: true as boolean});
getEachMessage({reference: true as boolean});
expectError(subprocess.getEachMessage({reference: 'true'} as const));
expectError(getEachMessage({reference: 'true'} as const));
