#!/usr/bin/env node
import process from 'node:process';
import {sendMessage, getEachMessage} from '../../index.js';
import {foobarString} from '../helpers/input.js';

await sendMessage(foobarString);

for await (const message of getEachMessage()) {
	if (message === foobarString) {
		break;
	}

	process.stdout.write(`${message}`);
}
