#!/usr/bin/env node
import process from 'node:process';
import {writeSync} from 'node:fs';
import {execaNode} from '../../index.js';

const [fakeExecArgv, nodeOptions, file, ...args] = process.argv.slice(2);

if (fakeExecArgv !== '') {
	process.execArgv = [fakeExecArgv];
}

const {stdout, stderr} = await execaNode(file, args, {nodeOptions: [nodeOptions].filter(Boolean)});
console.log(stdout);
writeSync(3, stderr);
