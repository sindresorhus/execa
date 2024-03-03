#!/usr/bin/env node
import process from 'node:process';
import {execa} from '../../index.js';

const [options, file, arg, unpipe] = process.argv.slice(2);
const subprocess = execa(file, [arg], JSON.parse(options));
subprocess.stdout.pipe(process.stdout);
if (unpipe === 'true') {
	subprocess.stdout.unpipe(process.stdout);
}

await subprocess;
