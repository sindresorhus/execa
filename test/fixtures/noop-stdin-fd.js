#!/usr/bin/env node
import process from 'node:process';
import {text} from 'node:stream/consumers';
import {writeSync} from 'node:fs';

const stdinString = await text(process.stdin);
const writableFileDescriptor = Number(process.argv[2]);
if (stdinString !== '') {
	writeSync(writableFileDescriptor, stdinString);
}
