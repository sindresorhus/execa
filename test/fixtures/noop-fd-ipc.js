#!/usr/bin/env node
import process from 'node:process';
import {promisify} from 'node:util';
import {sendMessage} from '../../index.js';
import {getWriteStream} from '../helpers/fs.js';
import {foobarString} from '../helpers/input.js';

const fdNumber = Number(process.argv[2]);
const bytes = process.argv[3] || foobarString;
const stream = getWriteStream(fdNumber);
await promisify(stream.write.bind(stream))(bytes);
await sendMessage('');
