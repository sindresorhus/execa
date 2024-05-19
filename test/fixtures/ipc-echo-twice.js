#!/usr/bin/env node
import {sendMessage, getOneMessage, exchangeMessage} from '../../index.js';

const message = await getOneMessage();
const secondMessage = await exchangeMessage(message);
await sendMessage(secondMessage);
