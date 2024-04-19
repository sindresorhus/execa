#!/usr/bin/env node
import process from 'node:process';
import {execa} from '../../index.js';

const [options, file, ...commandArguments] = process.argv.slice(2);
const firstArguments = commandArguments.slice(0, -1);
const lastArgument = commandArguments.at(-1);
await Promise.all([
	execa(file, [...firstArguments, lastArgument], JSON.parse(options)),
	execa(file, [...firstArguments, lastArgument.toUpperCase()], JSON.parse(options)),
]);
