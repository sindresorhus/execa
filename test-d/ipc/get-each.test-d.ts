import {expectType, expectError} from 'tsd';
import {getEachMessage, execa, type Message} from '../../index.js';

for await (const message of getEachMessage()) {
	expectType<Message>(message);
}

expectError(getEachMessage(''));

const subprocess = execa('test', {ipc: true});

for await (const message of subprocess.getEachMessage()) {
	expectType<Message<'advanced'>>(message);
}

for await (const message of execa('test', {ipc: true, serialization: 'json'}).getEachMessage()) {
	expectType<Message<'json'>>(message);
}

expectError(subprocess.getEachMessage(''));
expectError(await execa('test').getEachMessage());
expectError(await execa('test', {ipc: false}).getEachMessage());

