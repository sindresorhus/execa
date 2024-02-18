#!/usr/bin/env node
import process from 'node:process';
import {writeSync} from 'node:fs';

setInterval(() => {
	writeSync(Number(process.argv[2]) || 1, process.argv[3] || '.');
}, 10);
