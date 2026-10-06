#!/usr/bin/env node
import {getOneMessage, sendMessage} from '../../index.js';

const messagePromise = getOneMessage();
await sendMessage('.');
console.log(await messagePromise);
