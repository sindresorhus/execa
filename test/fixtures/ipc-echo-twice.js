#!/usr/bin/env node
import {sendMessage, getOneMessage} from '../../index.js';

const message = await getOneMessage();
await sendMessage(message);
const secondMessage = await getOneMessage();
await sendMessage(secondMessage);
