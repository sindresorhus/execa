#!/usr/bin/env node
import process from 'node:process';
import {getWriteStream} from '../helpers/fs.js';
import {foobarString} from '../helpers/input.js';

const fdNumber = Number(process.argv[2]) || 1;
const bytes = process.argv[3] || foobarString;
setInterval(() => {
	getWriteStream(fdNumber).write(bytes);
}, 10);
