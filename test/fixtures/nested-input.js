#!/usr/bin/env node
import process from 'node:process';
import {execa, execaSync} from '../../index.js';
import {foobarUtf16Uint8Array} from '../helpers/input.js';

const [optionsString, file, isSync, ...args] = process.argv.slice(2);
const options = {...JSON.parse(optionsString), input: foobarUtf16Uint8Array};
if (isSync === 'true') {
	execaSync(file, args, options);
} else {
	await execa(file, args, options);
}
