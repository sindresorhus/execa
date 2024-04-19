#!/usr/bin/env node
import process from 'node:process';
import {execa} from '../../index.js';

const [options, file, commandArgument] = process.argv.slice(2);
await execa(file, [commandArgument], {...JSON.parse(options), stdout: new WritableStream()});
