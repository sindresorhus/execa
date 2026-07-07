#!/usr/bin/env node
import {argv} from 'node:process';
import {getOneMessage} from '../../index.js';
import {isAlwaysTrue} from '../helpers/ipc.js';

const count = Number(argv[2]);
const filter = argv[3] === 'true' ? isAlwaysTrue : undefined;

for (let index = 0; index < count; index += 1) {
	// eslint-disable-next-line no-await-in-loop
	console.log(await getOneMessage({filter}));
}
