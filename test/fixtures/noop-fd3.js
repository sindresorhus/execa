#!/usr/bin/env node
import process from 'node:process';
import {writeSync} from 'node:fs';

const fileDescriptorIndex = Number(process.argv[3] || 3);
writeSync(fileDescriptorIndex, `${process.argv[2]}\n`);
