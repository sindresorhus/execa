#!/usr/bin/env node
import {sendMessage, getOneMessage} from '../../index.js';
import {foobarString} from '../helpers/input.js';

const [message] = await Promise.all([
	getOneMessage(),
	sendMessage(foobarString, {strict: true}),
]);
await sendMessage(message);
