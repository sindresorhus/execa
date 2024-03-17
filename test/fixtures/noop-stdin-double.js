#!/usr/bin/env node
import process from 'node:process';
import {text} from 'node:stream/consumers';

const bytes = process.argv[2];
const stdinString = await text(process.stdin);
console.log(`${stdinString} ${bytes}`);
