#!/usr/bin/env node
import process from 'node:process';
import {execa} from '../../index.js';
import {generatorsMap} from '../helpers/map.js';

const [optionsString, file, ...args] = process.argv.slice(2);
const {type, ...options} = JSON.parse(optionsString);
await execa(file, args, {stdout: generatorsMap[type].uppercase(), ...options});
