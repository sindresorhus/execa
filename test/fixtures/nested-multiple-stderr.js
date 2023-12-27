#!/usr/bin/env node
import process from 'node:process';
import {execa} from '../../index.js';

const [options] = process.argv.slice(2);
const result = await execa('noop-err.js', ['foobar'], {stderr: JSON.parse(options)});
process.stdout.write(`nested ${result.stderr}`);
