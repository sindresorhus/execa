#!/usr/bin/env node
import process from 'node:process';
import {execa} from '../../index.js';

const [stdioOption, index, file, ...args] = process.argv.slice(2);
let optionValue = JSON.parse(stdioOption);
optionValue = typeof optionValue === 'string' ? process[optionValue] : optionValue;
optionValue = Array.isArray(optionValue) && typeof optionValue[0] === 'string'
	? [process[optionValue[0]], ...optionValue.slice(1)]
	: optionValue;
const stdio = ['ignore', 'inherit', 'inherit'];
stdio[index] = optionValue;
const childProcess = execa(file, [`${index}`, ...args], {stdio});

const shouldPipe = Array.isArray(optionValue) && optionValue.includes('pipe');
const hasPipe = childProcess.stdio[index] !== null;

if (shouldPipe && !hasPipe) {
	throw new Error(`childProcess.stdio[${index}] is null.`);
}

if (!shouldPipe && hasPipe) {
	throw new Error(`childProcess.stdio[${index}] should be null.`);
}

await childProcess;
