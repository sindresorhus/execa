#!/usr/bin/env node
import {execa} from '../../index.js';

const uppercaseGenerator = async function * (lines) {
	for await (const line of lines) {
		yield line.toUpperCase();
	}
};

await execa('noop-fd.js', ['1'], {stdout: ['inherit', uppercaseGenerator]});
