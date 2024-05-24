#!/usr/bin/env node
import {getOneMessage} from '../../index.js';
import {foobarString} from '../helpers/input.js';

await getOneMessage({
	filter() {
		throw new Error(foobarString);
	},
});
