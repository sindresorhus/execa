#!/usr/bin/env node
import process from 'node:process';

const output = process.argv[2] || 'stdout';
const bytes = Number(process.argv[3] || 1e7);

process[output].write('.'.repeat(bytes - 1) + '\n');
