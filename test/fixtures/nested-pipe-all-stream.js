#!/usr/bin/env node
import process from 'node:process';
import {execa, getOneMessage} from '../../index.js';

const {file, commandArguments, options} = await getOneMessage();
const subprocess = execa(file, commandArguments, {...options, all: true});
subprocess.all.pipe(process.stdout);
await subprocess;
