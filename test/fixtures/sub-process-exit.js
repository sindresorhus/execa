#!/usr/bin/env node
import process from 'node:process';
import {execa} from '../../index.js';

const cleanup = process.argv[2] === 'true';
const detached = process.argv[3] === 'true';

const runChild = async () => {
	try {
		await execa('node', ['./test/fixtures/noop.js'], {cleanup, detached});
	} catch (error) {
		console.error(error);
		process.exit(1);
	}
};

runChild();
