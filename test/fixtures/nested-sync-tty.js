#!/usr/bin/env node
import process from 'node:process';
import tty from 'node:tty';
import {execa, execaSync} from '../../index.js';

const mockIsatty = fdNumber => {
	tty.isatty = fdNumberArg => fdNumber === fdNumberArg;
};

const originalIsatty = tty.isatty;
const unmockIsatty = () => {
	tty.isatty = originalIsatty;
};

const [options, isSync, file, fdNumber, ...args] = process.argv.slice(2);
mockIsatty(Number(fdNumber));

try {
	if (isSync === 'true') {
		execaSync(file, [fdNumber, ...args], JSON.parse(options));
	} else {
		await execa(file, [fdNumber, ...args], JSON.parse(options));
	}
} finally {
	unmockIsatty();
}
