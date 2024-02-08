#!/usr/bin/env node
import process from 'node:process';
import {writeSync} from 'node:fs';
import {execa, execaNode} from '../../index.js';

const [fakeExecArgv, execaMethod, nodeOptions, file, ...args] = process.argv.slice(2);

if (fakeExecArgv !== '') {
	process.execArgv = [fakeExecArgv];
}

const filteredNodeOptions = [nodeOptions].filter(Boolean);
const {stdout, stderr} = await (execaMethod === 'execaNode'
	? execaNode(file, args, {nodeOptions: filteredNodeOptions})
	: execa(file, args, {nodeOptions: filteredNodeOptions, node: true}));
console.log(stdout);
writeSync(3, stderr);
