#!/usr/bin/env node
import {sendMessage, getOneMessage} from '../../index.js';
import {foobarArray} from '../helpers/input.js';

await sendMessage(await getOneMessage(({filter: message => message === foobarArray[1]})));
