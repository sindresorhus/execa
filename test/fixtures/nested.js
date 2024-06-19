#!/usr/bin/env node
import {
	execa,
	execaSync,
	getOneMessage,
	sendMessage,
} from '../../index.js';

const {
	isSync,
	file,
	commandArguments,
	options,
	optionsFixture,
	optionsInput,
} = await getOneMessage();

let commandOptions = options;

// Some subprocess options cannot be serialized between processes.
// For those, we pass a fixture filename instead, which dynamically creates the options.
if (optionsFixture !== undefined) {
	const {getOptions} = await import(`./nested/${optionsFixture}`);
	commandOptions = {...commandOptions, ...getOptions({...commandOptions, ...optionsInput})};
}

try {
	const result = isSync
		? execaSync(file, commandArguments, commandOptions)
		: await execa(file, commandArguments, commandOptions);
	await sendMessage(result);
} catch (error) {
	await sendMessage(error);
}
