#!/usr/bin/env node
import process from 'node:process';
import {once} from 'node:events';
import {execa} from '../../index.js';

const [options, file, ...commandArguments] = process.argv.slice(2);
execa(file, commandArguments, JSON.parse(options));
const [error] = await once(process, 'unhandledRejection');
console.log(error.shortMessage);
