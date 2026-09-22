#!/usr/bin/env node
import process from 'node:process';

process.stdout.write(JSON.stringify(process.argv.slice(2)));
