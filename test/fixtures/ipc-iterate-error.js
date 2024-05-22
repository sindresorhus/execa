#!/usr/bin/env node
import process from 'node:process';
import {sendMessage, getEachMessage} from '../../index.js';
import {foobarString} from '../helpers/input.js';

const echoMessages = async () => {
	for await (const message of getEachMessage()) {
		if (message === foobarString) {
			break;
		}

		await sendMessage(message);
	}
};

process.on('error', () => {});
// eslint-disable-next-line unicorn/prefer-top-level-await
const promise = echoMessages();
process.emit('error', new Error(foobarString));
await promise;
