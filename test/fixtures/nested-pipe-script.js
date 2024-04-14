#!/usr/bin/env node
import process from 'node:process';
import {$} from '../../index.js';

const [
	sourceOptions,
	sourceFile,
	sourceArgument,
	destinationOptions,
	destinationFile,
	destinationArgument,
] = process.argv.slice(2);
await $(JSON.parse(sourceOptions))`${sourceFile} ${sourceArgument}`
	.pipe(JSON.parse(destinationOptions))`${destinationFile} ${destinationArgument === undefined ? [] : [destinationArgument]}`;
