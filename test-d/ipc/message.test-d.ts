import {File} from 'node:buffer';
import {expectTypeOf} from 'nz';
import {sendMessage, type Message} from '../../index.js';

await sendMessage('');
expectTypeOf<''>().toBeAssignableTo<Message>();
expectTypeOf<''>().toBeAssignableTo<Message<'advanced'>>();
expectTypeOf<''>().toBeAssignableTo<Message<'json'>>();

await sendMessage(0);
expectTypeOf<0>().toBeAssignableTo<Message>();
expectTypeOf<0>().toBeAssignableTo<Message<'advanced'>>();
expectTypeOf<0>().toBeAssignableTo<Message<'json'>>();

await sendMessage(true);
expectTypeOf<true>().toBeAssignableTo<Message>();
expectTypeOf<true>().toBeAssignableTo<Message<'advanced'>>();
expectTypeOf<true>().toBeAssignableTo<Message<'json'>>();

await sendMessage([] as const);
expectTypeOf([] as const).toBeAssignableTo<Message>();
expectTypeOf([] as const).toBeAssignableTo<Message<'advanced'>>();
expectTypeOf([] as const).toBeAssignableTo<Message<'json'>>();

await sendMessage([true] as const);
expectTypeOf([true] as const).toBeAssignableTo<Message>();
expectTypeOf([true] as const).toBeAssignableTo<Message<'advanced'>>();
expectTypeOf([true] as const).toBeAssignableTo<Message<'json'>>();

await sendMessage([undefined] as const);
expectTypeOf([undefined] as const).toBeAssignableTo<Message>();
expectTypeOf([undefined] as const).toBeAssignableTo<Message<'advanced'>>();
expectTypeOf([undefined] as const).not.toBeAssignableTo<Message<'json'>>();

await sendMessage([0n] as const);
expectTypeOf([0n] as const).toBeAssignableTo<Message>();
expectTypeOf([0n] as const).toBeAssignableTo<Message<'advanced'>>();
expectTypeOf([0n] as const).not.toBeAssignableTo<Message<'json'>>();

await sendMessage({} as const);
expectTypeOf({} as const).toBeAssignableTo<Message>();
expectTypeOf({} as const).toBeAssignableTo<Message<'advanced'>>();
expectTypeOf({} as const).toBeAssignableTo<Message<'json'>>();

await sendMessage({test: true} as const);
expectTypeOf({test: true} as const).toBeAssignableTo<Message>();
expectTypeOf({test: true} as const).toBeAssignableTo<Message<'advanced'>>();
expectTypeOf({test: true} as const).toBeAssignableTo<Message<'json'>>();

await sendMessage({test: undefined} as const);
expectTypeOf({test: undefined} as const).toBeAssignableTo<Message>();
expectTypeOf({test: undefined} as const).toBeAssignableTo<Message<'advanced'>>();
expectTypeOf({test: undefined} as const).not.toBeAssignableTo<Message<'json'>>();

await sendMessage({test: 0n} as const);
expectTypeOf({test: 0n} as const).toBeAssignableTo<Message>();
expectTypeOf({test: 0n} as const).toBeAssignableTo<Message<'advanced'>>();
expectTypeOf({test: 0n} as const).not.toBeAssignableTo<Message<'json'>>();

await sendMessage(null);
expectTypeOf<null>().toBeAssignableTo<Message>();
expectTypeOf<null>().toBeAssignableTo<Message<'advanced'>>();
expectTypeOf<null>().toBeAssignableTo<Message<'json'>>();

await sendMessage(NaN);
expectTypeOf(NaN).toBeAssignableTo<Message>();
expectTypeOf(NaN).toBeAssignableTo<Message<'advanced'>>();
expectTypeOf(NaN).toBeAssignableTo<Message<'json'>>();

await sendMessage(Infinity);
expectTypeOf(Infinity).toBeAssignableTo<Message>();
expectTypeOf(Infinity).toBeAssignableTo<Message<'advanced'>>();
expectTypeOf(Infinity).toBeAssignableTo<Message<'json'>>();

await sendMessage(new Map());
expectTypeOf(new Map()).toBeAssignableTo<Message>();
expectTypeOf(new Map()).toBeAssignableTo<Message<'advanced'>>();
expectTypeOf(new Map()).not.toBeAssignableTo<Message<'json'>>();

await sendMessage(new Set());
expectTypeOf(new Set()).toBeAssignableTo<Message>();
expectTypeOf(new Set()).toBeAssignableTo<Message<'advanced'>>();
expectTypeOf(new Set()).not.toBeAssignableTo<Message<'json'>>();

await sendMessage(new Date());
expectTypeOf(new Date()).toBeAssignableTo<Message>();
expectTypeOf(new Date()).toBeAssignableTo<Message<'advanced'>>();
expectTypeOf(new Date()).not.toBeAssignableTo<Message<'json'>>();

await sendMessage(/regexp/);
expectTypeOf(/regexp/).toBeAssignableTo<Message>();
expectTypeOf(/regexp/).toBeAssignableTo<Message<'advanced'>>();
expectTypeOf(/regexp/).not.toBeAssignableTo<Message<'json'>>();

await sendMessage(new Blob());
expectTypeOf(new Blob()).toBeAssignableTo<Message>();
expectTypeOf(new Blob()).toBeAssignableTo<Message<'advanced'>>();
expectTypeOf(new Blob()).not.toBeAssignableTo<Message<'json'>>();

await sendMessage(new File([], ''));
expectTypeOf(new File([], '')).toBeAssignableTo<Message>();
expectTypeOf(new File([], '')).toBeAssignableTo<Message<'advanced'>>();
expectTypeOf(new File([], '')).not.toBeAssignableTo<Message<'json'>>();

await sendMessage(new DataView(new ArrayBuffer(0)));
expectTypeOf(new DataView(new ArrayBuffer(0))).toBeAssignableTo<Message>();
expectTypeOf(new DataView(new ArrayBuffer(0))).toBeAssignableTo<Message<'advanced'>>();
expectTypeOf(new DataView(new ArrayBuffer(0))).not.toBeAssignableTo<Message<'json'>>();

await sendMessage(new ArrayBuffer(0));
expectTypeOf(new ArrayBuffer(0)).toBeAssignableTo<Message>();
expectTypeOf(new ArrayBuffer(0)).toBeAssignableTo<Message<'advanced'>>();
expectTypeOf(new ArrayBuffer(0)).not.toBeAssignableTo<Message<'json'>>();

await sendMessage(new SharedArrayBuffer(0));
expectTypeOf(new SharedArrayBuffer(0)).toBeAssignableTo<Message>();
expectTypeOf(new SharedArrayBuffer(0)).toBeAssignableTo<Message<'advanced'>>();
expectTypeOf(new SharedArrayBuffer(0)).not.toBeAssignableTo<Message<'json'>>();

await sendMessage(new Uint8Array());
expectTypeOf(new Uint8Array()).toBeAssignableTo<Message>();
expectTypeOf(new Uint8Array()).toBeAssignableTo<Message<'advanced'>>();
expectTypeOf(new Uint8Array()).not.toBeAssignableTo<Message<'json'>>();

await sendMessage(AbortSignal.abort());
expectTypeOf(AbortSignal.abort()).toBeAssignableTo<Message>();
expectTypeOf(AbortSignal.abort()).toBeAssignableTo<Message<'advanced'>>();
expectTypeOf(AbortSignal.abort()).not.toBeAssignableTo<Message<'json'>>();

await sendMessage(new Error('test'));
expectTypeOf(new Error('test')).toBeAssignableTo<Message>();
expectTypeOf(new Error('test')).toBeAssignableTo<Message<'advanced'>>();
expectTypeOf(new Error('test')).not.toBeAssignableTo<Message<'json'>>();
