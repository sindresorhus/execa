#!/usr/bin/env node
import {getEachMessage, sendMessage} from '../../index.js';
import {foobarString} from '../helpers/input.js';

for await (const message of getEachMessage()) {
	if (message === foobarString) {
		break;
	}

	await sendMessage(message);
}
