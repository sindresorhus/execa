#!/usr/bin/env node
import process from 'node:process';
import {getEachMessage} from '../../index.js';
import {foobarString} from '../helpers/input.js';

for await (const message of getEachMessage()) {
	if (message === foobarString) {
		break;
	}

	process.stdout.write(`${message}`);
}
