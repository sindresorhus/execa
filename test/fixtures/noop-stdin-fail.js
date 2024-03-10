#!/usr/bin/env node
import process from 'node:process';
import {text} from 'node:stream/consumers';
import {getWriteStream} from '../helpers/fs.js';

const fdNumber = Number(process.argv[2]);
const stdinString = await text(process.stdin);
getWriteStream(fdNumber).write(stdinString);
process.exitCode = 2;
