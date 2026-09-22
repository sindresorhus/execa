#!/usr/bin/env node
import process from 'node:process';
import {getCancelSignal} from 'execa';

// Each call must throw the same error, including when the first one is caught and retried
for (let index = 0; index < 2; index++) {
	try {
		await getCancelSignal();
	} catch {
		process.stdout.write('threw\n');
	}
}
