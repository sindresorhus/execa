#!/usr/bin/env node
import process from 'node:process';
import {execa} from '../../index.js';
import {outputObjectGenerator} from '../helpers/generator.js';

const [options, file, ...args] = process.argv.slice(2);
await execa(file, args, {stdout: outputObjectGenerator, ...JSON.parse(options)});
