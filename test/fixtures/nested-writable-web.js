#!/usr/bin/env node
import process from 'node:process';
import {execa} from '../../index.js';

const [options, file, arg] = process.argv.slice(2);
await execa(file, [arg], {...JSON.parse(options), stdout: new WritableStream()});
