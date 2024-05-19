#!/usr/bin/env node
import {sendMessage, getEachMessage} from '../../index.js';
import {foobarString} from '../helpers/input.js';

const iterable = getEachMessage();
await sendMessage(foobarString);

for await (const message of iterable) {
	console.log(message);
}
