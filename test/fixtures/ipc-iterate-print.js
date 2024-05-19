#!/usr/bin/env node
import process from 'node:process';
import {sendMessage, getEachMessage} from '../../index.js';
import {foobarString} from '../helpers/input.js';

const iterable = getEachMessage();

await sendMessage(foobarString);

for await (const message of iterable) {
	if (message === foobarString) {
		break;
	}

	process.stdout.write(`${message}`);
}
