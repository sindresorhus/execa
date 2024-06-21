#!/usr/bin/env node
import {execa, getOneMessage, sendMessage} from '../../index.js';
import {getNestedOptions} from '../helpers/nested.js';

const {
	file,
	commandArguments = [],
	options: {destinationFile, destinationArguments, ...options},
	optionsFixture,
	optionsInput,
} = await getOneMessage();

const commandOptions = await getNestedOptions(options, optionsFixture, optionsInput);

try {
	const result = await execa(file, commandArguments, commandOptions)
		.pipe(destinationFile, destinationArguments, commandOptions);
	await sendMessage(result);
} catch (error) {
	await sendMessage(error);
}
