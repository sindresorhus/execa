#!/usr/bin/env node
import process from 'node:process';
import {execa} from '../../index.js';
import {foobarString} from '../helpers/input.js';

const [options] = process.argv.slice(2);
const result = await execa('noop-fd.js', ['2', foobarString], {stderr: JSON.parse(options)});
process.stdout.write(`nested ${result.stderr}`);
