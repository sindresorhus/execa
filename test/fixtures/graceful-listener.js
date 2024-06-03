#!/usr/bin/env node
import {getCancelSignal, sendMessage} from 'execa';

const id = setTimeout(() => {}, 1e8);
const cancelSignal = await getCancelSignal();
// eslint-disable-next-line unicorn/prefer-add-event-listener
cancelSignal.onabort = async () => {
	await sendMessage(cancelSignal.reason);
	clearTimeout(id);
};

await sendMessage('.');
