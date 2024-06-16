#!/usr/bin/env node
import {execa, getOneMessage} from '../../index.js';

const {
	file,
	commandArguments = [],
	options: {
		sourceOptions = {},
		destinationFile,
		destinationArguments = [],
		destinationOptions = {},
	},
} = await getOneMessage();
await execa(file, commandArguments, sourceOptions)
	.pipe(execa(destinationFile, destinationArguments, destinationOptions));
