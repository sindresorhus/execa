#!/usr/bin/env node
import process from 'node:process';
import {writeSync} from 'node:fs';

const index = Number(process.argv[2]);
const bytes = '.'.repeat(Number(process.argv[3] || 1e7));
if (index === 1) {
	process.stdout.write(bytes);
} else if (index === 2) {
	process.stderr.write(bytes);
} else {
	writeSync(index, bytes);
}
