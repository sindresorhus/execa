#!/usr/bin/env node
import process from 'node:process';
import {execa} from '../../index.js';

const [options, file, ...args] = process.argv.slice(2);
const firstArgs = args.slice(0, -1);
const lastArg = args.at(-1);
await Promise.all([
	execa(file, [...firstArgs, lastArg], JSON.parse(options)),
	execa(file, [...firstArgs, lastArg.toUpperCase()], JSON.parse(options)),
]);
