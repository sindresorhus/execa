import {expectType, expectError} from 'tsd';
import {getOneMessage, execa, type Message} from '../../index.js';

expectType<Promise<Message>>(getOneMessage());
expectError(await getOneMessage(''));

const subprocess = execa('test', {ipc: true});
expectType<Message<'advanced'>>(await subprocess.getOneMessage());
expectType<Message<'json'>>(await execa('test', {ipc: true, serialization: 'json'}).getOneMessage());

expectError(await subprocess.getOneMessage(''));
expectError(await execa('test').getOneMessage());
expectError(await execa('test', {ipc: false}).getOneMessage());
