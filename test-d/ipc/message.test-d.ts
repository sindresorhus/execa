import {File} from 'node:buffer';
import {expectAssignable, expectNotAssignable} from 'tsd';
import {sendMessage, exchangeMessage, type Message} from '../../index.js';

await sendMessage('');
await exchangeMessage('');
expectAssignable<Message>('');
expectAssignable<Message<'advanced'>>('');
expectAssignable<Message<'json'>>('');

await sendMessage(0);
await exchangeMessage(0);
expectAssignable<Message>(0);
expectAssignable<Message<'advanced'>>(0);
expectAssignable<Message<'json'>>(0);

await sendMessage(true);
await exchangeMessage(true);
expectAssignable<Message>(true);
expectAssignable<Message<'advanced'>>(true);
expectAssignable<Message<'json'>>(true);

await sendMessage([] as const);
await exchangeMessage([] as const);
expectAssignable<Message>([] as const);
expectAssignable<Message<'advanced'>>([] as const);
expectAssignable<Message<'json'>>([] as const);

await sendMessage([true] as const);
await exchangeMessage([true] as const);
expectAssignable<Message>([true] as const);
expectAssignable<Message<'advanced'>>([true] as const);
expectAssignable<Message<'json'>>([true] as const);

await sendMessage([undefined] as const);
await exchangeMessage([undefined] as const);
expectAssignable<Message>([undefined] as const);
expectAssignable<Message<'advanced'>>([undefined] as const);
expectNotAssignable<Message<'json'>>([undefined] as const);

await sendMessage([0n] as const);
await exchangeMessage([0n] as const);
expectAssignable<Message>([0n] as const);
expectAssignable<Message<'advanced'>>([0n] as const);
expectNotAssignable<Message<'json'>>([0n] as const);

await sendMessage({} as const);
await exchangeMessage({} as const);
expectAssignable<Message>({} as const);
expectAssignable<Message<'advanced'>>({} as const);
expectAssignable<Message<'json'>>({} as const);

await sendMessage({test: true} as const);
await exchangeMessage({test: true} as const);
expectAssignable<Message>({test: true} as const);
expectAssignable<Message<'advanced'>>({test: true} as const);
expectAssignable<Message<'json'>>({test: true} as const);

await sendMessage({test: undefined} as const);
await exchangeMessage({test: undefined} as const);
expectAssignable<Message>({test: undefined} as const);
expectAssignable<Message<'advanced'>>({test: undefined} as const);
expectNotAssignable<Message<'json'>>({test: undefined} as const);

await sendMessage({test: 0n} as const);
await exchangeMessage({test: 0n} as const);
expectAssignable<Message>({test: 0n} as const);
expectAssignable<Message<'advanced'>>({test: 0n} as const);
expectNotAssignable<Message<'json'>>({test: 0n} as const);

await sendMessage(null);
await exchangeMessage(null);
expectAssignable<Message>(null);
expectAssignable<Message<'advanced'>>(null);
expectAssignable<Message<'json'>>(null);

await sendMessage(Number.NaN);
await exchangeMessage(Number.NaN);
expectAssignable<Message>(Number.NaN);
expectAssignable<Message<'advanced'>>(Number.NaN);
expectAssignable<Message<'json'>>(Number.NaN);

await sendMessage(Number.POSITIVE_INFINITY);
await exchangeMessage(Number.POSITIVE_INFINITY);
expectAssignable<Message>(Number.POSITIVE_INFINITY);
expectAssignable<Message<'advanced'>>(Number.POSITIVE_INFINITY);
expectAssignable<Message<'json'>>(Number.POSITIVE_INFINITY);

await sendMessage(new Map());
await exchangeMessage(new Map());
expectAssignable<Message>(new Map());
expectAssignable<Message<'advanced'>>(new Map());
expectNotAssignable<Message<'json'>>(new Map());

await sendMessage(new Set());
await exchangeMessage(new Set());
expectAssignable<Message>(new Set());
expectAssignable<Message<'advanced'>>(new Set());
expectNotAssignable<Message<'json'>>(new Set());

await sendMessage(new Date());
await exchangeMessage(new Date());
expectAssignable<Message>(new Date());
expectAssignable<Message<'advanced'>>(new Date());
expectNotAssignable<Message<'json'>>(new Date());

await sendMessage(/regexp/);
await exchangeMessage(/regexp/);
expectAssignable<Message>(/regexp/);
expectAssignable<Message<'advanced'>>(/regexp/);
expectNotAssignable<Message<'json'>>(/regexp/);

await sendMessage(new Blob());
await exchangeMessage(new Blob());
expectAssignable<Message>(new Blob());
expectAssignable<Message<'advanced'>>(new Blob());
expectNotAssignable<Message<'json'>>(new Blob());

await sendMessage(new File([], ''));
await exchangeMessage(new File([], ''));
expectAssignable<Message>(new File([], ''));
expectAssignable<Message<'advanced'>>(new File([], ''));
expectNotAssignable<Message<'json'>>(new File([], ''));

await sendMessage(new DataView(new ArrayBuffer(0)));
await exchangeMessage(new DataView(new ArrayBuffer(0)));
expectAssignable<Message>(new DataView(new ArrayBuffer(0)));
expectAssignable<Message<'advanced'>>(new DataView(new ArrayBuffer(0)));
expectNotAssignable<Message<'json'>>(new DataView(new ArrayBuffer(0)));

await sendMessage(new ArrayBuffer(0));
await exchangeMessage(new ArrayBuffer(0));
expectAssignable<Message>(new ArrayBuffer(0));
expectAssignable<Message<'advanced'>>(new ArrayBuffer(0));
expectNotAssignable<Message<'json'>>(new ArrayBuffer(0));

await sendMessage(new SharedArrayBuffer(0));
await exchangeMessage(new SharedArrayBuffer(0));
expectAssignable<Message>(new SharedArrayBuffer(0));
expectAssignable<Message<'advanced'>>(new SharedArrayBuffer(0));
expectNotAssignable<Message<'json'>>(new SharedArrayBuffer(0));

await sendMessage(new Uint8Array());
await exchangeMessage(new Uint8Array());
expectAssignable<Message>(new Uint8Array());
expectAssignable<Message<'advanced'>>(new Uint8Array());
expectNotAssignable<Message<'json'>>(new Uint8Array());

await sendMessage(AbortSignal.abort());
await exchangeMessage(AbortSignal.abort());
expectAssignable<Message>(AbortSignal.abort());
expectAssignable<Message<'advanced'>>(AbortSignal.abort());
expectNotAssignable<Message<'json'>>(AbortSignal.abort());

await sendMessage(new Error('test'));
await exchangeMessage(new Error('test'));
expectAssignable<Message>(new Error('test'));
expectAssignable<Message<'advanced'>>(new Error('test'));
expectNotAssignable<Message<'json'>>(new Error('test'));
