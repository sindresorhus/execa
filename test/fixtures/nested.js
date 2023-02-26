#!/usr/bin/env node
import process from 'node:process';
import {execa} from '../../index.js';

const [options, file, ...args] = process.argv.slice(2);
const nestedOptions = {stdio: 'inherit', ...JSON.parse(options)};
await execa(file, args, nestedOptions);
