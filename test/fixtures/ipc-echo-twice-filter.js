#!/usr/bin/env node
import {sendMessage, getOneMessage} from '../../index.js';
import {alwaysPass} from '../helpers/ipc.js';

const message = await getOneMessage({filter: alwaysPass});
const secondMessagePromise = getOneMessage({filter: alwaysPass});
await sendMessage(message);
await sendMessage(await secondMessagePromise);
