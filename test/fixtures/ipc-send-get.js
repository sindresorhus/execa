#!/usr/bin/env node
import {sendMessage, getOneMessage} from '../../index.js';
import {foobarString} from '../helpers/input.js';

await Promise.all([
	getOneMessage(),
	sendMessage(foobarString),
]);
