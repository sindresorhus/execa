#!/usr/bin/env node
import process from 'node:process';
import {text} from 'node:stream/consumers';

const input = await text(process.stdin);
process.stdout.write(`${input}:stdout`);
process.stderr.write(`${input}:stderr`);
