#!/usr/bin/env node
import process from 'node:process';
import {getReadStream} from '../helpers/fs.js';

const fdNumber = Number(process.argv[2]);
getReadStream(fdNumber).pipe(process.stdout);
