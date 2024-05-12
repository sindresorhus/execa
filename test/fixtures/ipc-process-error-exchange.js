#!/usr/bin/env node
import process from 'node:process';
import {exchangeMessage} from '../../index.js';
import {foobarString} from '../helpers/input.js';

const cause = new Error(foobarString);
await Promise.all([
	exchangeMessage('.'),
	process.emit('error', cause),
]);
