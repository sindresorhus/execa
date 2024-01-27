#!/usr/bin/env node
import {execa} from '../../index.js';

const uppercaseGenerator = function * (line) {
	yield line.toUpperCase();
};

await execa('noop-fd.js', ['1'], {stdout: ['inherit', uppercaseGenerator]});
