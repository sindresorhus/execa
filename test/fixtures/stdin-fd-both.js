#!/usr/bin/env node
import process from 'node:process';
import {readFileSync} from 'node:fs';

const fdNumber = Number(process.argv[2]);

process.stdin.pipe(process.stdout);
process.stdout.write(readFileSync(fdNumber));
