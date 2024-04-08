import {once} from 'node:events';
import {workerData, parentPort} from 'node:worker_threads';
import {execa} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';

setFixtureDir();

const {nodeFile, args, options} = workerData;
try {
	const subprocess = execa(nodeFile, args, options);
	const [parentResult, [{result, error}]] = await Promise.all([subprocess, once(subprocess, 'message')]);
	parentPort.postMessage({parentResult, result, error});
} catch (parentError) {
	parentPort.postMessage({parentError});
}
