#!/usr/bin/env node
import process from 'node:process';
import {getWriteStream} from '../helpers/fs.js';

const fdNumber = Number(process.argv[2]);
const bytes = '.'.repeat(Number(process.argv[3] || 1e7));
getWriteStream(fdNumber).write(bytes);
