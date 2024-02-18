#!/usr/bin/env node
import process from 'node:process';
import {execa} from '../../index.js';

const [options, file, ...args] = process.argv.slice(2);
const result = await execa(file, args, JSON.parse(options));
process.send(result);
