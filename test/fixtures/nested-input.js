#!/usr/bin/env node
import process from 'node:process';
import {execa} from '../../index.js';
import {foobarUtf16Uint8Array} from '../helpers/input.js';

const [options, file, ...args] = process.argv.slice(2);
await execa(file, args, {...JSON.parse(options), input: foobarUtf16Uint8Array});
