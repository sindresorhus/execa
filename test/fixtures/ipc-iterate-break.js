#!/usr/bin/env node
import {sendMessage, getEachMessage} from '../../index.js';
import {foobarString} from '../helpers/input.js';

const iterable = getEachMessage();
await sendMessage(foobarString);

// eslint-disable-next-line no-unreachable-loop
for await (const _ of iterable) {
	break;
}
