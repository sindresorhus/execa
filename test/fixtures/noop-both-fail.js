#!/usr/bin/env node
import process from 'node:process';

process.stdout.write(process.argv[2]);
process.stderr.write(process.argv[3]);
process.exit(1);
