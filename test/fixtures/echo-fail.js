#!/usr/bin/env node
import process from 'node:process';
import {getWriteStream} from '../helpers/fs.js';

console.log('stdout');
console.error('stderr');
getWriteStream(3).write('fd3');
process.exitCode = 1;
