import {workerData, parentPort} from 'node:worker_threads';
import {execa} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';

setFixtureDirectory();

const {nodeFile, commandArguments, options} = workerData;
try {
	const subprocess = execa(nodeFile, commandArguments, options);
	const [parentResult, {result, error}] = await Promise.all([subprocess, subprocess.getOneMessage()]);
	parentPort.postMessage({parentResult, result, error});
} catch (parentError) {
	parentPort.postMessage({parentError});
}
