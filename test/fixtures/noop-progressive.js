#!/usr/bin/env node
import process from 'node:process';
import {setTimeout} from 'node:timers/promises';

const bytes = process.argv[2];
for (const character of bytes) {
	process.stdout.write(character);
	// eslint-disable-next-line no-await-in-loop
	await setTimeout(10);
}

process.stdout.write('\n');
