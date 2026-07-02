#!/usr/bin/env node
import {argv} from 'node:process';
import {getEachMessage} from '../../index.js';

const count = Number(argv[2]);

for (let index = 0; index < count; index += 1) {
	// eslint-disable-next-line no-await-in-loop, no-unreachable-loop
	for await (const message of getEachMessage()) {
		console.log(message);
		// eslint-disable-next-line unicorn/no-break-in-nested-loop -- breaks only the inner loop, the outer loop must continue
		break;
	}
}
