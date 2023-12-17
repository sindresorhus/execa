#!/usr/bin/env node
import process from 'node:process';
import {execa} from '../../index.js';

const [options] = process.argv.slice(2);
const result = await execa('noop.js', ['foobar'], {stdout: JSON.parse(options)});
process.stderr.write(`nested ${result.stdout}`);
