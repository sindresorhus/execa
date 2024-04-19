#!/usr/bin/env node
import process from 'node:process';
import {execa, execaSync} from '../../index.js';
import {parseStdioOption} from '../helpers/stdio.js';

const [stdioOption, fdNumber, isSyncString, file, ...commandArguments] = process.argv.slice(2);
const optionValue = parseStdioOption(stdioOption);
const isSync = isSyncString === 'true';
const stdio = ['ignore', 'inherit', 'inherit'];
stdio[fdNumber] = optionValue;
const execaMethod = isSync ? execaSync : execa;
const returnValue = execaMethod(file, [`${fdNumber}`, ...commandArguments], {stdio});

const shouldPipe = Array.isArray(optionValue) && optionValue.includes('pipe');
const fdReturnValue = returnValue.stdio[fdNumber];
const hasPipe = fdReturnValue !== undefined && fdReturnValue !== null;

if (shouldPipe && !hasPipe) {
	throw new Error(`subprocess.stdio[${fdNumber}] is null.`);
}

if (!shouldPipe && hasPipe) {
	throw new Error(`subprocess.stdio[${fdNumber}] should be null.`);
}

if (!isSync) {
	await returnValue;
}
