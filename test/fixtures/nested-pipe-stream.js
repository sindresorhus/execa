#!/usr/bin/env node
import process from 'node:process';
import {execa, getOneMessage} from '../../index.js';

const {file, commandArguments, options: {unpipe, ...options}} = await getOneMessage();
const subprocess = execa(file, commandArguments, options);
subprocess.stdout.pipe(process.stdout);
if (unpipe) {
	subprocess.stdout.unpipe(process.stdout);
}

await subprocess;
