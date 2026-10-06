#!/usr/bin/env node
import process from 'node:process';
import {execa, execaSync} from '../../index.js';

// Prints the number of chunks a binary input transform receives, when `stdin` is inherited from the current process
const chunks = [];
const execaMethod = process.argv[2] === 'sync' ? execaSync : execa;
await execaMethod('stdin.js', {
	stdin: ['inherit', {
		* transform(chunk) {
			chunks.push(chunk);
			yield chunk;
		},
		binary: true,
	}],
});
console.log(chunks.length);
