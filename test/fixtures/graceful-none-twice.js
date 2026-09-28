#!/usr/bin/env node
import process from 'node:process';
import {getCancelSignal} from 'execa';

// Each call must throw the same error, including when the first one is caught and retried
// The calls are sequential on purpose, so the second one is retried after the first one was caught
for (let index = 0; index < 2; index++) {
	try {
		// eslint-disable-next-line no-await-in-loop -- the second call is retried only after the first one was caught
		await getCancelSignal();
	} catch {
		process.stdout.write('threw\n');
	}
}
