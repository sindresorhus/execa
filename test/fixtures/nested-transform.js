#!/usr/bin/env node
import process from 'node:process';
import {execa, execaSync} from '../../index.js';
import {generatorsMap} from '../helpers/map.js';

const [optionsString, file, ...args] = process.argv.slice(2);
const {type, isSync, ...options} = JSON.parse(optionsString);
const newOptions = {stdout: generatorsMap[type].uppercase(), ...options};
if (isSync === 'true') {
	execaSync(file, args, newOptions);
} else {
	await execa(file, args, newOptions);
}
