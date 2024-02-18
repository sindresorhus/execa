#!/usr/bin/env node
import process from 'node:process';
import {setTimeout} from 'node:timers/promises';

for (const character of process.argv[2]) {
	process.stdout.write(character);
	// eslint-disable-next-line no-await-in-loop
	await setTimeout(10);
}

process.stdout.write('\n');
