#!/usr/bin/env node
import process from 'node:process';
import {getWriteStream} from '../helpers/fs.js';
import {execa, execaNode} from '../../index.js';

const [fakeExecArgv, execaMethod, nodeOptions, file, ...commandArguments] = process.argv.slice(2);

if (fakeExecArgv !== '') {
	process.execArgv = [fakeExecArgv];
}

const filteredNodeOptions = [nodeOptions].filter(Boolean);
const {stdout, stderr} = await (execaMethod === 'execaNode'
	? execaNode(file, commandArguments, {nodeOptions: filteredNodeOptions})
	: execa(file, commandArguments, {nodeOptions: filteredNodeOptions, node: true}));
console.log(stdout);
getWriteStream(3).write(stderr);
