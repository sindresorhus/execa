#!/usr/bin/env node
import process from 'node:process';
import {execa} from '../../index.js';

const [sourceOptions, sourceFile, sourceArg, destinationOptions, destinationFile, destinationArg] = process.argv.slice(2);
await execa(sourceFile, [sourceArg], JSON.parse(sourceOptions))
	.pipe(destinationFile, destinationArg === undefined ? [] : [destinationArg], JSON.parse(destinationOptions));
