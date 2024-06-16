#!/usr/bin/env node
import {execa, getOneMessage} from '../../index.js';

const {file, commandArguments, options} = await getOneMessage();
const firstArguments = commandArguments.slice(0, -1);
const lastArgument = commandArguments.at(-1);
await Promise.all([
	execa(file, [...firstArguments, lastArgument], options),
	execa(file, [...firstArguments, lastArgument.toUpperCase()], options),
]);
