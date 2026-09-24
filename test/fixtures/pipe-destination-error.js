#!/usr/bin/env node
import process from 'node:process';
import {setTimeout} from 'node:timers/promises';
import {execa} from '../../index.js';

// The destination subprocess is spawned before the `to` option is validated.
// Its error must not become an unhandled rejection, which would crash this process.
// It must also be terminated, otherwise it would prevent this process from exiting.
const [destinationFile] = process.argv.slice(2);

try {
	await execa('empty.js', {stdout: 'ignore'}).pipe(destinationFile, [], {to: 'fd9'});
} catch {}

await setTimeout(500);
process.stdout.write('REACHED THE END');
