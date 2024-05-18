#!/usr/bin/env node
import process from 'node:process';
import {getOneMessage} from '../../index.js';
import {foobarString} from '../helpers/input.js';

const cause = new Error(foobarString);
await Promise.all([
	getOneMessage(),
	process.emit('error', cause),
]);
