#!/usr/bin/env node
import process from 'node:process';
import {execa, execaSync} from '../../index.js';
import {foobarString} from '../helpers/input.js';
import {parseStdioOption} from '../helpers/stdio.js';

const [stdioOption, isSyncString] = process.argv.slice(2);
const stdin = parseStdioOption(stdioOption);
const execaMethod = isSyncString === 'true' ? execaSync : execa;
await execaMethod('stdin.js', {input: foobarString, stdin, stdout: 'inherit'});
