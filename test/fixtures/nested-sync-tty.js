#!/usr/bin/env node
import process from 'node:process';
import tty from 'node:tty';
import {execa, execaSync} from '../../index.js';

const mockIsatty = fdNumber => {
	tty.isatty = fdNumberArgument => fdNumber === fdNumberArgument;
};

const originalIsatty = tty.isatty;
const unmockIsatty = () => {
	tty.isatty = originalIsatty;
};

const [options, isSync, file, fdNumber, ...commandArguments] = process.argv.slice(2);
mockIsatty(Number(fdNumber));

try {
	if (isSync === 'true') {
		execaSync(file, [fdNumber, ...commandArguments], JSON.parse(options));
	} else {
		await execa(file, [fdNumber, ...commandArguments], JSON.parse(options));
	}
} finally {
	unmockIsatty();
}
