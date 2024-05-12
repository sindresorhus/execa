#!/usr/bin/env node
import process from 'node:process';
import {getOneMessage} from '../../index.js';
import {foobarString} from '../helpers/input.js';
import {alwaysPass} from '../helpers/ipc.js';

const cause = new Error(foobarString);
await Promise.all([
	getOneMessage({filter: alwaysPass}),
	process.emit('error', cause),
]);
