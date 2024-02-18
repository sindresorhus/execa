#!/usr/bin/env node
import process from 'node:process';
import {text} from 'node:stream/consumers';

const stdinString = await text(process.stdin);
console.log(`${stdinString} ${process.argv[2]}`);
