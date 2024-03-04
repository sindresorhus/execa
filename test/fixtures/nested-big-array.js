#!/usr/bin/env node
import process from 'node:process';
import {execa} from '../../index.js';
import {getOutputGenerator} from '../helpers/generator.js';

const bigArray = Array.from({length: 100}, (_, index) => index);
const [options, file, ...args] = process.argv.slice(2);
await execa(file, args, {stdout: getOutputGenerator(bigArray, true), ...JSON.parse(options)});
