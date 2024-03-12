#!/usr/bin/env node
import process from 'node:process';
import {writeSync} from 'node:fs';

const writableFileDescriptor = Number(process.argv[2]);
process.stdin.on('data', chunk => {
	writeSync(writableFileDescriptor, chunk);
});
