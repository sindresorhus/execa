#!/usr/bin/env node
import process from 'node:process';
import {sendMessage, getOneMessage} from '../../index.js';
import {PARALLEL_COUNT} from '../helpers/parallel.js';
import {alwaysPass, getFirst} from '../helpers/ipc.js';

const filter = process.argv[2] === 'true' ? alwaysPass : undefined;

await sendMessage(await getOneMessage({filter}));

const messages = Array.from({length: PARALLEL_COUNT}, (_, index) => index + 1);
await Promise.all([
	...messages.map(message => sendMessage(message)),
	process.emit('message', '.'),
]);

const promise = process.argv[3] === 'true'
	? getFirst()
	: getOneMessage({filter});
await sendMessage(await promise);
