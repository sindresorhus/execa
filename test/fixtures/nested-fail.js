#!/usr/bin/env node
import process from 'node:process';
import {execa} from '../../index.js';

const [options, file, ...args] = process.argv.slice(2);
const subprocess = execa(file, args, JSON.parse(options));
subprocess.kill(new Error(args[0]));
await subprocess;
