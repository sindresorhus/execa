#!/usr/bin/env node
import process from 'node:process';
import {exchangeMessage} from '../../index.js';
import {foobarString} from '../helpers/input.js';
import {alwaysPass} from '../helpers/ipc.js';

const cause = new Error(foobarString);
await Promise.all([
	exchangeMessage('.', {filter: alwaysPass}),
	process.emit('error', cause),
]);
