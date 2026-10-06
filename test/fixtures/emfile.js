#!/usr/bin/env node
import {openSync, closeSync} from 'node:fs';
import process from 'node:process';
import {execa} from '../../index.js';

// Open files until none can be opened anymore, so that spawning fails with EMFILE
const fileDescriptors = [];
try {
	while (true) {
		fileDescriptors.push(openSync(process.execPath, 'r'));
	}
} catch {
	// No file descriptor is left
}

let error;
try {
	await execa(process.execPath, ['--version']);
} catch (error_) {
	error = error_;
}

for (const fileDescriptor of fileDescriptors) {
	closeSync(fileDescriptor);
}

console.log(`${error.name} ${error.code}`);
