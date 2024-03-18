#!/usr/bin/env node
import process from 'node:process';
import {getReadStream} from '../helpers/fs.js';

const fdNumber = Number(process.argv[2]);

process.stdin.pipe(process.stdout);
getReadStream(fdNumber).pipe(process.stderr);
