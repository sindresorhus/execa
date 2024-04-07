#!/usr/bin/env node
import process from 'node:process';
import {execa, execaSync} from '../../index.js';
import {generatorsMap} from '../helpers/map.js';
import {outputObjectGenerator, getOutputGenerator} from '../helpers/generator.js';
import {simpleFull} from '../helpers/lines.js';

const getTransform = (type, transformName) => {
	if (type !== undefined) {
		return generatorsMap[type].uppercase();
	}

	if (transformName === 'object') {
		return outputObjectGenerator();
	}

	if (transformName === 'stringObject') {
		return getOutputGenerator(simpleFull)(true);
	}

	if (transformName === 'bigArray') {
		const bigArray = Array.from({length: 100}, (_, index) => index);
		return getOutputGenerator(bigArray)(true);
	}
};

const [optionsString, file, ...args] = process.argv.slice(2);
const {type, transformName, isSync, ...options} = JSON.parse(optionsString);
const newOptions = {stdout: getTransform(type, transformName), ...options};
if (isSync) {
	execaSync(file, args, newOptions);
} else {
	await execa(file, args, newOptions);
}
