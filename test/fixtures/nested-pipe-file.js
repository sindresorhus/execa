#!/usr/bin/env node
import process from 'node:process';
import {execa} from '../../index.js';

const [
	sourceOptions,
	sourceFile,
	sourceArgument,
	destinationOptions,
	destinationFile,
	destinationArgument,
] = process.argv.slice(2);
await execa(sourceFile, [sourceArgument], JSON.parse(sourceOptions))
	.pipe(destinationFile, destinationArgument === undefined ? [] : [destinationArgument], JSON.parse(destinationOptions));
