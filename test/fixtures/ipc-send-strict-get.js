#!/usr/bin/env node
import {sendMessage, getOneMessage} from '../../index.js';
import {foobarString} from '../helpers/input.js';

await sendMessage(foobarString, {strict: true});
await sendMessage(await getOneMessage());
