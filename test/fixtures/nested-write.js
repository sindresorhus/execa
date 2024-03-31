#!/usr/bin/env node
import {writeFile} from 'node:fs/promises';
import {text} from 'node:stream/consumers';
import process from 'node:process';

const [filePath, bytes] = process.argv.slice(2);
const stdinString = await text(process.stdin);
await writeFile(filePath, `${stdinString} ${bytes}`);
