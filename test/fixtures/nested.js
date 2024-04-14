#!/usr/bin/env node
import process from 'node:process';
import {execa} from '../../index.js';

const [options, file, ...commandArguments] = process.argv.slice(2);
try {
	const result = await execa(file, commandArguments, JSON.parse(options));
	process.send({result});
} catch (error) {
	process.send({error});
}
