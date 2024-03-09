#!/usr/bin/env node
import process from 'node:process';
import {execa} from '../../index.js';

const [stdioOption, fdNumber, file, ...args] = process.argv.slice(2);
let optionValue = JSON.parse(stdioOption);
optionValue = typeof optionValue === 'string' ? process[optionValue] : optionValue;
optionValue = Array.isArray(optionValue) && typeof optionValue[0] === 'string'
	? [process[optionValue[0]], ...optionValue.slice(1)]
	: optionValue;
const stdio = ['ignore', 'inherit', 'inherit'];
stdio[fdNumber] = optionValue;
const subprocess = execa(file, [`${fdNumber}`, ...args], {stdio});

const shouldPipe = Array.isArray(optionValue) && optionValue.includes('pipe');
const hasPipe = subprocess.stdio[fdNumber] !== null;

if (shouldPipe && !hasPipe) {
	throw new Error(`subprocess.stdio[${fdNumber}] is null.`);
}

if (!shouldPipe && hasPipe) {
	throw new Error(`subprocess.stdio[${fdNumber}] should be null.`);
}

await subprocess;
