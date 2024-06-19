#!/usr/bin/env node
import {execa, getOneMessage} from '../../index.js';

const {file, commandArguments, options: {unpipe, ...options}} = await getOneMessage();
const source = execa(file, commandArguments, options);
const destination = execa('stdin.js');
const controller = new AbortController();
const subprocess = source.pipe(destination, {unpipeSignal: controller.signal});
if (unpipe) {
	controller.abort();
	destination.stdin.end();
}

try {
	await subprocess;
} catch {}
