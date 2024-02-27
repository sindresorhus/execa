#!/usr/bin/env node
import process from 'node:process';
import {readFileSync} from 'node:fs';

const fdNumber = Number(process.argv[2]);
if (fdNumber === 0) {
	process.stdin.pipe(process.stdout);
} else {
	process.stdout.write(readFileSync(fdNumber));
}
