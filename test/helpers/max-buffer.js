import {execa, execaSync} from '../../index.js';

export const maxBuffer = 10;

export const assertErrorMessage = (t, shortMessage, {execaMethod = execa, length = maxBuffer, fdNumber = 1, unit = 'characters'} = {}) => {
	const [expectedStreamName, expectedUnit] = execaMethod === execaSync
		? ['output', 'bytes']
		: [STREAM_NAMES[fdNumber], unit];
	t.true(shortMessage.includes(`${expectedStreamName} was larger than ${length} ${expectedUnit}`));
};

const STREAM_NAMES = ['stdin', 'stdout', 'stderr', 'stdio[3]'];
