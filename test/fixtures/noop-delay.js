#!/usr/bin/env node
import process from 'node:process';
import {setTimeout} from 'node:timers/promises';
import {getWriteStream} from '../helpers/fs.js';
import {foobarString} from '../helpers/input.js';

const fdNumber = Number(process.argv[2]);
getWriteStream(fdNumber).write(foobarString);
await setTimeout(100);
