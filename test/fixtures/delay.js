#!/usr/bin/env node
import process from 'node:process';

const delay = Number(process.argv[2]);
setTimeout(() => {}, delay);
