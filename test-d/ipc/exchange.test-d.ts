import {expectType, expectError} from 'tsd';
import {
	exchangeMessage,
	execa,
	type Message,
	type Options,
} from '../../index.js';

const subprocess = execa('test', {ipc: true});
expectType<Promise<Message<'advanced'>>>(subprocess.exchangeMessage(''));
const jsonSubprocess = execa('test', {ipc: true, serialization: 'json'});
expectType<Promise<Message<'json'>>>(jsonSubprocess.exchangeMessage(''));
expectType<Promise<Message>>(exchangeMessage(''));

expectError(await subprocess.exchangeMessage());
expectError(await exchangeMessage());
expectError(await subprocess.exchangeMessage(undefined));
expectError(await exchangeMessage(undefined));
expectError(await subprocess.exchangeMessage(0n));
expectError(await exchangeMessage(0n));
expectError(await subprocess.exchangeMessage(Symbol('test')));
expectError(await exchangeMessage(Symbol('test')));
expectError(await subprocess.exchangeMessage('', ''));
expectError(await exchangeMessage('', ''));
expectError(await subprocess.exchangeMessage('', {}, ''));
expectError(await exchangeMessage('', {}, ''));

await execa('test', {ipcInput: ''}).exchangeMessage('');
await execa('test', {ipcInput: '' as Message}).exchangeMessage('');
await execa('test', {} as Options).exchangeMessage?.('');
await execa('test', {ipc: true as boolean}).exchangeMessage?.('');
await execa('test', {ipcInput: '' as '' | undefined}).exchangeMessage?.('');

expectType<undefined>(execa('test').exchangeMessage);
expectType<undefined>(execa('test', {}).exchangeMessage);
expectType<undefined>(execa('test', {ipc: false}).exchangeMessage);
expectType<undefined>(execa('test', {ipcInput: undefined}).exchangeMessage);
expectType<undefined>(execa('test', {ipc: false, ipcInput: ''}).exchangeMessage);

await subprocess.exchangeMessage('', {filter: undefined} as const);
await subprocess.exchangeMessage('', {filter: (message: Message<'advanced'>) => true} as const);
await jsonSubprocess.exchangeMessage('', {filter: (message: Message<'json'>) => true} as const);
await jsonSubprocess.exchangeMessage('', {filter: (message: Message<'advanced'>) => true} as const);
await subprocess.exchangeMessage('', {filter: (message: Message<'advanced'> | bigint) => true} as const);
await subprocess.exchangeMessage('', {filter: () => true} as const);
expectError(await subprocess.exchangeMessage('', {filter: (message: Message<'advanced'>) => ''} as const));
// eslint-disable-next-line @typescript-eslint/no-empty-function
expectError(await subprocess.exchangeMessage('', {filter(message: Message<'advanced'>) {}} as const));
expectError(await subprocess.exchangeMessage('', {filter: (message: Message<'json'>) => true} as const));
expectError(await subprocess.exchangeMessage('', {filter: (message: '') => true} as const));
expectError(await subprocess.exchangeMessage('', {filter: true} as const));
expectError(await subprocess.exchangeMessage('', {unknownOption: true} as const));

await exchangeMessage('', {filter: undefined} as const);
await exchangeMessage('', {filter: (message: Message) => true} as const);
await exchangeMessage('', {filter: (message: Message<'advanced'>) => true} as const);
await exchangeMessage('', {filter: (message: Message | bigint) => true} as const);
await exchangeMessage('', {filter: () => true} as const);
expectError(await exchangeMessage('', {filter: (message: Message) => ''} as const));
// eslint-disable-next-line @typescript-eslint/no-empty-function
expectError(await exchangeMessage('', {filter(message: Message) {}} as const));
expectError(await exchangeMessage('', {filter: (message: Message<'json'>) => true} as const));
expectError(await exchangeMessage('', {filter: (message: '') => true} as const));
expectError(await exchangeMessage('', {filter: true} as const));
expectError(await exchangeMessage('', {unknownOption: true} as const));
