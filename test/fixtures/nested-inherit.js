#!/usr/bin/env node
import {execa} from '../../index.js';

const uppercaseGenerator = async function * (chunks) {
	for await (const chunk of chunks) {
		yield chunk.toUpperCase();
	}
};

await execa('noop-fd.js', ['1'], {stdout: ['inherit', uppercaseGenerator]});
