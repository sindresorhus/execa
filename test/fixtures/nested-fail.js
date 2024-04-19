#!/usr/bin/env node
import process from 'node:process';
import {execa} from '../../index.js';

const [options, file, ...commandArguments] = process.argv.slice(2);
const subprocess = execa(file, commandArguments, JSON.parse(options));
subprocess.kill(new Error(commandArguments[0]));
await subprocess;
