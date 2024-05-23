#!/usr/bin/env node
import {sendMessage, getOneMessage} from '../../index.js';
import {foobarArray} from '../helpers/input.js';

const message = await getOneMessage({filter: message => message === foobarArray[1]});
await sendMessage(message);
