#!/usr/bin/env node
import process from 'node:process';
import {getWriteStream} from '../helpers/fs.js';

const fdNumber = Number(process.argv[2]);
process.stdin.pipe(getWriteStream(fdNumber));
