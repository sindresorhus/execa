#!/usr/bin/env node
import process from 'node:process';
import {sendMessage, getOneMessage} from '../../index.js';
import {PARALLEL_COUNT} from '../helpers/parallel.js';
import {alwaysPass, getFirst} from '../helpers/ipc.js';

const filter = process.argv[2] === 'true' ? alwaysPass : undefined;

await sendMessage(await getOneMessage({filter}));

const promise = sendMessage(1);
process.emit('message', '.');
await promise;

const messages = Array.from({length: PARALLEL_COUNT}, (_, index) => index + 2);
for (const message of messages) {
	// eslint-disable-next-line no-await-in-loop
	await sendMessage(message);
}

const secondPromise = process.argv[3] === 'true'
	? getFirst()
	: getOneMessage({filter});
await sendMessage(await secondPromise);
