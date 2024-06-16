#!/usr/bin/env node
import {workerData, parentPort} from 'node:worker_threads';
import {spawnParentProcess} from '../helpers/nested.js';

try {
	const result = await spawnParentProcess(workerData);
	parentPort.postMessage(result);
} catch (error) {
	parentPort.postMessage(error);
}
