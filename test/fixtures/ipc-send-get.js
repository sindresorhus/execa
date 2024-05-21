#!/usr/bin/env node
import {exchangeMessage} from '../../index.js';
import {foobarString} from '../helpers/input.js';

await exchangeMessage(foobarString);
