#!/usr/bin/env node
import assert from 'node:assert/strict';
import process from 'node:process';
import {Writable} from 'node:stream';
import {execa, execaSync} from '../../index.js';
import {getStdio} from '../helpers/stdio.js';
import {getStreamName} from '../../lib/utils/standard-stream.js';

const [method, fileDescriptor, fdNumber = '1', wrapped = 'false', shape = 'object'] = process.argv.slice(2);
const execaMethod = method === 'sync' ? execaSync : execa;
const value = shape === 'stream' ? Object.assign(new Writable({write() {}}), {fd: Number(fileDescriptor)}) : {fd: Number(fileDescriptor)};
assert.throws(() => {
	execaMethod(process.execPath, ['-e', ''], getStdio(Number(fdNumber), wrapped === 'true' ? {value} : value));
}, {name: 'TypeError', message: `The \`${getStreamName(Number(fdNumber))}\` option must be a non-negative 32-bit integer: got ${fileDescriptor}.`});
