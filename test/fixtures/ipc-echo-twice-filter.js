#!/usr/bin/env node
import {sendMessage, getOneMessage, exchangeMessage} from '../../index.js';
import {alwaysPass} from '../helpers/ipc.js';

const message = await getOneMessage({filter: alwaysPass});
const secondMessage = await exchangeMessage(message, {filter: alwaysPass});
await sendMessage(secondMessage);
