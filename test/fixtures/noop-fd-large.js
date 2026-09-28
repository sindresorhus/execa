#!/usr/bin/env node
import {Buffer} from 'node:buffer';
import process from 'node:process';
import {getWriteStream} from '../helpers/fs.js';

const fdNumber = Number(process.argv[2]);
const bytes = Number(process.argv[3]);
getWriteStream(fdNumber).write(Buffer.alloc(bytes, 'a'));
