#!/usr/bin/env node
import process from 'node:process';

const stdoutBytes = process.argv[2];
const stderrBytes = process.argv[3];
process.stdout.write(stdoutBytes);
process.stderr.write(stderrBytes);
process.exitCode = 1;
