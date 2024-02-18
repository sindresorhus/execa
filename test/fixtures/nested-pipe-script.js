#!/usr/bin/env node
import process from 'node:process';
import {$} from '../../index.js';

const [sourceOptions, sourceFile, sourceArg, destinationOptions, destinationFile, destinationArg] = process.argv.slice(2);
await $(JSON.parse(sourceOptions))`${sourceFile} ${sourceArg}`
	.pipe(JSON.parse(destinationOptions))`${destinationFile} ${destinationArg === undefined ? [] : [destinationArg]}`;
