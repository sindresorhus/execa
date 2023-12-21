#!/usr/bin/env node
import process from 'node:process';
import {readFileSync} from 'node:fs';

const fileDescriptorIndex = Number(process.argv[3] || 3);
console.log(readFileSync(fileDescriptorIndex, {encoding: 'utf8'}));
