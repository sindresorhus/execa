#!/usr/bin/env node
import process from 'node:process';
import {sendMessage} from '../../index.js';

const bytes = process.argv[2];
console.log(bytes);

try {
	await sendMessage(bytes);
} catch {}

process.exitCode = 2;
