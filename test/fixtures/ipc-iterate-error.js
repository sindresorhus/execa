#!/usr/bin/env node
import process from 'node:process';
import {getEachMessage} from '../../index.js';
import {foobarString} from '../helpers/input.js';

// @todo: replace with Array.fromAsync(subprocess.getEachMessage()) after dropping support for Node <22.0.0
const iterateAllMessages = async () => {
	const messages = [];
	for await (const message of getEachMessage()) {
		messages.push(message);
	}

	return messages;
};

const cause = new Error(foobarString);
await Promise.all([
	iterateAllMessages(),
	process.emit('error', cause),
]);
