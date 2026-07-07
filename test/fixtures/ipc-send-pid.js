#!/usr/bin/env node
import process from 'node:process';
import {execa, sendMessage} from '../../index.js';

const isCleanup = process.argv[2] === 'true';
const isDetached = process.argv[3] === 'true';
const file = process.argv[4] === 'no-killable' ? 'no-killable.js' : 'forever.js';
const options = {
	cleanup: isCleanup,
	detached: isDetached,
	...(file === 'no-killable.js' && {
		ipc: true,
		killSignal: 'SIGKILL',
	}),
};
const subprocess = execa(file, options);
if (options.ipc) {
	await subprocess.getOneMessage();
}

await sendMessage(subprocess.pid);
await subprocess;
