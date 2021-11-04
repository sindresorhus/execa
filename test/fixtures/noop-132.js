#!/usr/bin/env node
import process from 'node:process';

process.stdout.write('1');
process.stderr.write('3');

setTimeout(() => {
	process.stdout.write('2');
}, 1000);
