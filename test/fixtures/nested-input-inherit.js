#!/usr/bin/env node
import process from 'node:process';
import {execa, execaSync} from '../../index.js';
import {foobarString} from '../helpers/input.js';

const [optionName, stdioOptionString, isSyncString] = process.argv.slice(2);
const execaMethod = isSyncString === 'true' ? execaSync : execa;
const options = {
	input: foobarString,
	[optionName]: JSON.parse(stdioOptionString),
};

if (optionName === 'stdin') {
	options.stdout = 'inherit';
}

await execaMethod('stdin.js', options);
