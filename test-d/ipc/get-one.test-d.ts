import {expectType, expectError} from 'tsd';
import {
	getOneMessage,
	execa,
	type Message,
	type Options,
} from '../../index.js';

const subprocess = execa('test', {ipc: true});
expectType<Promise<Message<'advanced'>>>(subprocess.getOneMessage());
const jsonSubprocess = execa('test', {ipc: true, serialization: 'json'});
expectType<Promise<Message<'json'>>>(jsonSubprocess.getOneMessage());
expectType<Promise<Message>>(getOneMessage());

expectError(await subprocess.getOneMessage(''));
expectError(await getOneMessage(''));
expectError(await subprocess.getOneMessage({}, ''));
expectError(await getOneMessage({}, ''));

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

await subprocess.getOneMessage({filter: undefined} as const);
await subprocess.getOneMessage({filter: (message: Message<'advanced'>) => true} as const);
await jsonSubprocess.getOneMessage({filter: (message: Message<'json'>) => true} as const);
await jsonSubprocess.getOneMessage({filter: (message: Message<'advanced'>) => true} as const);
await subprocess.getOneMessage({filter: (message: Message<'advanced'> | bigint) => true} as const);
await subprocess.getOneMessage({filter: () => true} as const);
expectError(await subprocess.getOneMessage({filter: (message: Message<'advanced'>) => ''} as const));
// eslint-disable-next-line @typescript-eslint/no-empty-function
expectError(await subprocess.getOneMessage({filter(message: Message<'advanced'>) {}} as const));
expectError(await subprocess.getOneMessage({filter: (message: Message<'json'>) => true} as const));
expectError(await subprocess.getOneMessage({filter: (message: '') => true} as const));
expectError(await subprocess.getOneMessage({filter: true} as const));

await getOneMessage({filter: undefined} as const);
await getOneMessage({filter: (message: Message) => true} as const);
await getOneMessage({filter: (message: Message<'advanced'>) => true} as const);
await getOneMessage({filter: (message: Message | bigint) => true} as const);
await getOneMessage({filter: () => true} as const);
expectError(await getOneMessage({filter: (message: Message) => ''} as const));
// eslint-disable-next-line @typescript-eslint/no-empty-function
expectError(await getOneMessage({filter(message: Message) {}} as const));
expectError(await getOneMessage({filter: (message: Message<'json'>) => true} as const));
expectError(await getOneMessage({filter: (message: '') => true} as const));
expectError(await getOneMessage({filter: true} as const));

expectError(await subprocess.getOneMessage({unknownOption: true} as const));
expectError(await getOneMessage({unknownOption: true} as const));

await subprocess.getOneMessage({reference: true} as const);
await getOneMessage({reference: true} as const);
expectError(await subprocess.getOneMessage({reference: 'true'} as const));
expectError(await getOneMessage({reference: 'true'} as const));
