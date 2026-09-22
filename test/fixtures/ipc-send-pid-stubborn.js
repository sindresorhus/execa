#!/usr/bin/env node
import {execa, sendMessage} from '../../index.js';

// Spawns a descendant which ignores `SIGTERM` and keeps this process' `stdout` open.
// This process is not awaiting it, so it exits on `SIGTERM` while that descendant keeps running.
const subprocess = execa('no-killable.js', {
	ipc: true,
	killSignal: 'SIGKILL',
	stdout: 'inherit',
	cleanup: false,
});
await subprocess.getOneMessage();
await sendMessage(subprocess.pid);
setTimeout(() => {}, 1e8);
