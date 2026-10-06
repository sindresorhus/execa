#!/usr/bin/env node
import {execa} from '../../index.js';

// The file cannot be opened, since its directory does not exist.
// Its stream is created before the next item is rejected, which throws before spawning.
try {
	execa('empty.js', {stdout: [{file: '/nonexistent-directory-for-execa/file'}, ['foo']]});
} catch (error) {
	console.log(error.message);
}
