import test from 'ava';
import {execa} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {foobarString} from '../helpers/input.js';

setFixtureDir();

// eslint-disable-next-line max-params
const testRedirect = async (t, stdioOption, fdNumber, isInput, isSync) => {
	const {fixtureName, ...options} = isInput
		? {fixtureName: 'stdin-fd.js', input: foobarString}
		: {fixtureName: 'noop-fd.js'};
	const {stdio} = await execa('nested-stdio.js', [JSON.stringify(stdioOption), `${fdNumber}`, `${isSync}`, fixtureName, foobarString], options);
	const resultFdNumber = isStderrDescriptor(stdioOption) ? 2 : 1;
	t.is(stdio[resultFdNumber], foobarString);
};

const isStderrDescriptor = stdioOption => stdioOption === 2
	|| stdioOption === 'stderr'
	|| (Array.isArray(stdioOption) && isStderrDescriptor(stdioOption[0]));

test.serial('stdio[*] can be 0', testRedirect, 0, 3, true, false);
test.serial('stdio[*] can be [0]', testRedirect, [0], 3, true, false);
test.serial('stdio[*] can be [0, "pipe"]', testRedirect, [0, 'pipe'], 3, true, false);
test.serial('stdio[*] can be process.stdin', testRedirect, 'stdin', 3, true, false);
test.serial('stdio[*] can be [process.stdin]', testRedirect, ['stdin'], 3, true, false);
test.serial('stdio[*] can be [process.stdin, "pipe"]', testRedirect, ['stdin', 'pipe'], 3, true, false);
test('stdout can be 2', testRedirect, 2, 1, false, false);
test('stdout can be [2]', testRedirect, [2], 1, false, false);
test('stdout can be [2, "pipe"]', testRedirect, [2, 'pipe'], 1, false, false);
test('stdout can be process.stderr', testRedirect, 'stderr', 1, false, false);
test('stdout can be [process.stderr]', testRedirect, ['stderr'], 1, false, false);
test('stdout can be [process.stderr, "pipe"]', testRedirect, ['stderr', 'pipe'], 1, false, false);
test('stderr can be 1', testRedirect, 1, 2, false, false);
test('stderr can be [1]', testRedirect, [1], 2, false, false);
test('stderr can be [1, "pipe"]', testRedirect, [1, 'pipe'], 2, false, false);
test('stderr can be process.stdout', testRedirect, 'stdout', 2, false, false);
test('stderr can be [process.stdout]', testRedirect, ['stdout'], 2, false, false);
test('stderr can be [process.stdout, "pipe"]', testRedirect, ['stdout', 'pipe'], 2, false, false);
test('stdio[*] can be 1', testRedirect, 1, 3, false, false);
test('stdio[*] can be [1]', testRedirect, [1], 3, false, false);
test('stdio[*] can be [1, "pipe"]', testRedirect, [1, 'pipe'], 3, false, false);
test('stdio[*] can be 2', testRedirect, 2, 3, false, false);
test('stdio[*] can be [2]', testRedirect, [2], 3, false, false);
test('stdio[*] can be [2, "pipe"]', testRedirect, [2, 'pipe'], 3, false, false);
test('stdio[*] can be process.stdout', testRedirect, 'stdout', 3, false, false);
test('stdio[*] can be [process.stdout]', testRedirect, ['stdout'], 3, false, false);
test('stdio[*] can be [process.stdout, "pipe"]', testRedirect, ['stdout', 'pipe'], 3, false, false);
test('stdio[*] can be process.stderr', testRedirect, 'stderr', 3, false, false);
test('stdio[*] can be [process.stderr]', testRedirect, ['stderr'], 3, false, false);
test('stdio[*] can be [process.stderr, "pipe"]', testRedirect, ['stderr', 'pipe'], 3, false, false);
test('stdout can be 2, sync', testRedirect, 2, 1, false, true);
test('stdout can be [2], sync', testRedirect, [2], 1, false, true);
test('stdout can be [2, "pipe"], sync', testRedirect, [2, 'pipe'], 1, false, true);
test('stdout can be process.stderr, sync', testRedirect, 'stderr', 1, false, true);
test('stdout can be [process.stderr], sync', testRedirect, ['stderr'], 1, false, true);
test('stdout can be [process.stderr, "pipe"], sync', testRedirect, ['stderr', 'pipe'], 1, false, true);
test('stderr can be 1, sync', testRedirect, 1, 2, false, true);
test('stderr can be [1], sync', testRedirect, [1], 2, false, true);
test('stderr can be [1, "pipe"], sync', testRedirect, [1, 'pipe'], 2, false, true);
test('stderr can be process.stdout, sync', testRedirect, 'stdout', 2, false, true);
test('stderr can be [process.stdout], sync', testRedirect, ['stdout'], 2, false, true);
test('stderr can be [process.stdout, "pipe"], sync', testRedirect, ['stdout', 'pipe'], 2, false, true);
test('stdio[*] can be 1, sync', testRedirect, 1, 3, false, true);
test('stdio[*] can be [1], sync', testRedirect, [1], 3, false, true);
test('stdio[*] can be [1, "pipe"], sync', testRedirect, [1, 'pipe'], 3, false, true);
test('stdio[*] can be 2, sync', testRedirect, 2, 3, false, true);
test('stdio[*] can be [2], sync', testRedirect, [2], 3, false, true);
test('stdio[*] can be [2, "pipe"], sync', testRedirect, [2, 'pipe'], 3, false, true);
test('stdio[*] can be process.stdout, sync', testRedirect, 'stdout', 3, false, true);
test('stdio[*] can be [process.stdout], sync', testRedirect, ['stdout'], 3, false, true);
test('stdio[*] can be [process.stdout, "pipe"], sync', testRedirect, ['stdout', 'pipe'], 3, false, true);
test('stdio[*] can be process.stderr, sync', testRedirect, 'stderr', 3, false, true);
test('stdio[*] can be [process.stderr], sync', testRedirect, ['stderr'], 3, false, true);
test('stdio[*] can be [process.stderr, "pipe"], sync', testRedirect, ['stderr', 'pipe'], 3, false, true);
