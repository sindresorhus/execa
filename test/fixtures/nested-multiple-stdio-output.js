#!/usr/bin/env node
import {Buffer} from 'node:buffer';
import process from 'node:process';
import {execa, execaSync} from '../../index.js';
import {foobarString} from '../helpers/input.js';
import {getStdio, parseStdioOption} from '../helpers/stdio.js';
import {getWriteStream} from '../helpers/fs.js';

const [stdioOption, fdNumber, outerFdNumber, isSyncString, encoding] = process.argv.slice(2);
const stdioValue = parseStdioOption(stdioOption);
const execaMethod = isSyncString === 'true' ? execaSync : execa;
const {stdio} = await execaMethod('noop-fd.js', [fdNumber, foobarString], {...getStdio(Number(fdNumber), stdioValue), encoding});
getWriteStream(Number(outerFdNumber)).write(`nested ${Buffer.from(stdio[fdNumber]).toString()}`);
