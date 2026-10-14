#!/usr/bin/env node
import process from 'node:process';
import {getWriteStream} from '../helpers/fs.js';

const fdNumber = Number(process.argv[2]);
const bytes = '.'.repeat(Number(process.argv[3]));
// The signal is ignored, or makes the subprocess exit with a specific exit code
const [signal, exitCode] = process.argv.slice(4);
if (signal !== undefined) {
	process.on(signal, () => {
		if (exitCode !== undefined) {
			process.exit(Number(exitCode));
		}
	});
}

getWriteStream(fdNumber).write(bytes);
setTimeout(() => {}, 1e8);
