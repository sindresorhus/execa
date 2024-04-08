#!/usr/bin/env node
import process from 'node:process';
import {execaSync} from '../../index.js';

const [options, file, ...args] = process.argv.slice(2);
try {
	const result = execaSync(file, args, JSON.parse(options));
	process.send({result});
} catch (error) {
	process.send({error});
}
