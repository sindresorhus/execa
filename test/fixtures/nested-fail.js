#!/usr/bin/env node
import process from 'node:process';
import {execa} from '../../index.js';

const [options, file, ...args] = process.argv.slice(2);
const childProcess = execa(file, args, JSON.parse(options));
childProcess.kill(new Error(args[0]));
await childProcess;
