#!/usr/bin/env node
import process from 'node:process';
import {execa} from '../../index.js';

const [options, file, arg, unpipe] = process.argv.slice(2);
const source = execa(file, [arg], JSON.parse(options));
const destination = execa('stdin.js');
const controller = new AbortController();
const pipePromise = source.pipe(destination, {unpipeSignal: controller.signal});
if (unpipe === 'true') {
	controller.abort();
	destination.stdin.end();
}

await Promise.allSettled([source, destination, pipePromise]);
