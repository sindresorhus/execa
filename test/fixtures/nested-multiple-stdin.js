#!/usr/bin/env node
import process from 'node:process';
import {execa} from '../../index.js';
import {foobarString} from '../helpers/input.js';

const [options] = process.argv.slice(2);
const subprocess = execa('stdin.js', {stdin: JSON.parse(options)});
subprocess.stdin.write(foobarString);
const {stdout} = await subprocess;
console.log(stdout);
