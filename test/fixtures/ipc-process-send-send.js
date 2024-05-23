#!/usr/bin/env node
import process from 'node:process';
import {foobarString} from '../helpers/input.js';
import {sendMessage} from '../../index.js';

await sendMessage('.');

process.send(foobarString, () => {
	console.log('.');
});
