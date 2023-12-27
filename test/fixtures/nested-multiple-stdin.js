#!/usr/bin/env node
import process from 'node:process';
import {execa} from '../../index.js';

const [options] = process.argv.slice(2);
const childProcess = execa('stdin.js', {stdin: JSON.parse(options)});
childProcess.stdin.write('foobar');
const {stdout} = await childProcess;
console.log(stdout);
