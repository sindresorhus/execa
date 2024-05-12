import {expectType, expectError} from 'tsd';
import {sendMessage, execa} from '../../index.js';

expectType<Promise<void>>(sendMessage(''));

expectError(await sendMessage());
expectError(await sendMessage(undefined));
expectError(await sendMessage(0n));
expectError(await sendMessage(Symbol('test')));

const subprocess = execa('test', {ipc: true});
expectType<void>(await subprocess.sendMessage(''));

expectError(await subprocess.sendMessage());
expectError(await execa('test').sendMessage(''));
expectError(await execa('test', {ipc: false}).sendMessage(''));
