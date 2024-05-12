#!/usr/bin/env node
import process from 'node:process';
import {sendMessage, getOneMessage} from '../../index.js';
import {foobarString} from '../helpers/input.js';

const cause = new Error(foobarString);
try {
	await Promise.all([
		getOneMessage(),
		process.emit('error', cause),
	]);
} catch (error) {
	await sendMessage(error);
}
