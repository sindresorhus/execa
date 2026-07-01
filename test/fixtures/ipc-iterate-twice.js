#!/usr/bin/env node
import {sendMessage, getEachMessage} from '../../index.js';
import {foobarString} from '../helpers/input.js';

for (let index = 0; index < 2; index += 1) {
	// Intentionally not awaiting `sendMessage()` to avoid a race condition
	sendMessage(foobarString);
	// eslint-disable-next-line no-await-in-loop
	for await (const message of getEachMessage()) {
		if (message === foobarString) {
			// eslint-disable-next-line unicorn/no-break-in-nested-loop -- breaks only the inner loop, the outer loop must continue
			break;
		}

		await sendMessage(`${index}${message}`);
	}
}
