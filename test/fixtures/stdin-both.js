#!/usr/bin/env node
import process from 'node:process';

process.stdin.pipe(process.stdout);
process.stdin.pipe(process.stderr);
