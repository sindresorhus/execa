#!/usr/bin/env node
import {sendMessage, exchangeMessage} from '../../index.js';
import {foobarArray} from '../helpers/input.js';

await sendMessage(await exchangeMessage('.', ({filter: message => message === foobarArray[1]})));
