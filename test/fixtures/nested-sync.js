#!/usr/bin/env node
import process from 'node:process';
import {execaSync, sendMessage} from '../../index.js';

const [options, file, ...commandArguments] = process.argv.slice(2);
try {
	const result = execaSync(file, commandArguments, JSON.parse(options));
	await sendMessage({result});
} catch (error) {
	await sendMessage({error});
}
