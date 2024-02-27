#!/usr/bin/env node
import process from 'node:process';
import {writeSync} from 'node:fs';

const fdNumber = Number(process.argv[2]);
const bytes = '.'.repeat(Number(process.argv[3] || 1e7));
if (fdNumber === 1) {
	process.stdout.write(bytes);
} else if (fdNumber === 2) {
	process.stderr.write(bytes);
} else {
	writeSync(fdNumber, bytes);
}
