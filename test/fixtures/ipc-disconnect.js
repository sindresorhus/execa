#!/usr/bin/env node
import process from 'node:process';
import {once} from 'node:events';
import * as execaExports from '../../index.js';

const methodName = process.argv[2];

if (process.channel !== null) {
	await once(process, 'disconnect');
}

await execaExports[methodName]();
