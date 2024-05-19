#!/usr/bin/env node
import process from 'node:process';
import {getOneMessage} from '../../index.js';

process.disconnect();
console.log(process.channel);
await getOneMessage();
