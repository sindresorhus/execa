#!/usr/bin/env node
import process from 'node:process';
import {execa} from '../../index.js';
import {generatorsMap} from '../helpers/map.js';

const type = process.argv[2];
await execa('noop-fd.js', ['1'], {stdout: ['inherit', generatorsMap[type].uppercase()]});
