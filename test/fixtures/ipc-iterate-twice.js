#!/usr/bin/env node
import {sendMessage, getEachMessage} from '../../index.js';
import {foobarString} from '../helpers/input.js';

for (let index = 0; index < 2; index += 1) {
	// eslint-disable-next-line no-await-in-loop
	for await (const message of getEachMessage()) {
		if (message === foobarString) {
			break;
		}

		await sendMessage(message);
	}

	// eslint-disable-next-line no-await-in-loop
	await sendMessage(foobarString);
}
