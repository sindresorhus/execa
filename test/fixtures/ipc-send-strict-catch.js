#!/usr/bin/env node
import {sendMessage} from '../../index.js';
import {foobarString} from '../helpers/input.js';

try {
	await sendMessage(foobarString, {strict: true});
} catch {
	await sendMessage(foobarString);
}
