#!/usr/bin/env node
import process from 'node:process';
import {execa} from '../../index.js';

const [options, file, arg, unpipe] = process.argv.slice(2);
const childProcess = execa(file, [arg], JSON.parse(options));
childProcess.stdout.pipe(process.stdout);
if (unpipe === 'true') {
	childProcess.stdout.unpipe(process.stdout);
}

await childProcess;
