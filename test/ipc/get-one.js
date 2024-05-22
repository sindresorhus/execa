import {once} from 'node:events';
import {setTimeout} from 'node:timers/promises';
import test from 'ava';
import {execa} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString, foobarArray} from '../helpers/input.js';
import {
	subprocessGetOne,
	subprocessSendGetOne,
	subprocessExchange,
	alwaysPass,
} from '../helpers/ipc.js';
import {PARALLEL_COUNT} from '../helpers/parallel.js';

setFixtureDirectory();

const testKeepAlive = async (t, buffer, exchangeMethod) => {
	const subprocess = execa('ipc-echo-twice.js', {ipc: true, buffer});
	t.is(await exchangeMethod(subprocess, foobarString), foobarString);
	t.is(await exchangeMethod(subprocess, foobarString), foobarString);
	await subprocess;
};

test('subprocess.getOneMessage() keeps the subprocess alive, buffer false', testKeepAlive, false, subprocessSendGetOne);
test('subprocess.getOneMessage() keeps the subprocess alive, buffer true', testKeepAlive, true, subprocessSendGetOne);
test('subprocess.getOneMessage() keeps the subprocess alive, buffer false, exchangeMessage()', testKeepAlive, false, subprocessExchange);
test('subprocess.getOneMessage() keeps the subprocess alive, buffer true, exchangeMessage()', testKeepAlive, true, subprocessExchange);

const testBufferInitial = async (t, buffer, exchangeMethod) => {
	const subprocess = execa('ipc-echo-wait.js', {ipc: true, buffer});
	t.is(await exchangeMethod(subprocess, foobarString), foobarString);
	await subprocess;
};

test('Buffers initial message to subprocess, buffer false', testBufferInitial, false, subprocessSendGetOne);
test('Buffers initial message to subprocess, buffer true', testBufferInitial, true, subprocessSendGetOne);
test('Buffers initial message to subprocess, buffer false, exchangeMessage()', testBufferInitial, false, subprocessExchange);
test('Buffers initial message to subprocess, buffer true, exchangeMessage()', testBufferInitial, true, subprocessExchange);

test('Buffers initial message to current process, buffer false', async t => {
	const subprocess = execa('ipc-send-print.js', {ipc: true, buffer: false});
	const [chunk] = await once(subprocess.stdout, 'data');
	t.is(chunk.toString(), '.');
	t.is(await subprocess.getOneMessage(), foobarString);
	await subprocess.sendMessage('.');
	await subprocess;
});

test.serial('Does not buffer initial message to current process, buffer true', async t => {
	const subprocess = execa('ipc-send-print.js', {ipc: true});
	const [chunk] = await once(subprocess.stdout, 'data');
	t.is(chunk.toString(), '.');
	await setTimeout(1e3);
	t.is(await Promise.race([setTimeout(0), subprocess.getOneMessage()]), undefined);
	await subprocess.sendMessage('.');
	const {ipcOutput} = await subprocess;
	t.deepEqual(ipcOutput, [foobarString]);
});

const testFilterParent = async (t, exchangeMethod) => {
	const subprocess = execa('ipc-send-twice.js', {ipc: true});
	const message = await exchangeMethod(subprocess, {filter: message => message === foobarArray[1]});
	t.is(message, foobarArray[1]);

	const {ipcOutput} = await subprocess;
	t.deepEqual(ipcOutput, foobarArray);
};

test('subprocess.getOneMessage() can filter messages', testFilterParent, subprocessGetOne);
test('subprocess.exchangeMessage() can filter messages', testFilterParent, subprocessExchange);

const testFilterSubprocess = async (t, fixtureName, expectedOutput) => {
	const subprocess = execa(fixtureName, {ipc: true});
	await subprocess.sendMessage(foobarArray[0]);
	await subprocess.sendMessage(foobarArray[1]);

	const {ipcOutput} = await subprocess;
	t.deepEqual(ipcOutput, expectedOutput);
};

test('exports.getOneMessage() can filter messages', testFilterSubprocess, 'ipc-echo-filter.js', [foobarArray[1]]);
test('exports.exchangeMessage() can filter messages', testFilterSubprocess, 'ipc-echo-filter-exchange.js', ['.', foobarArray[1]]);

const testHeavyLoad = async (t, exchangeMethod) => {
	await Promise.all(
		Array.from({length: PARALLEL_COUNT}, async (_, index) => {
			const subprocess = execa('ipc-send-argv.js', [`${index}`], {ipc: true, buffer: false});
			t.is(await exchangeMethod(subprocess, {}), `${index}`);
			await subprocess;
		}),
	);
};

test.serial('Can retrieve initial IPC messages under heavy load', testHeavyLoad, subprocessGetOne);
test.serial('Can retrieve initial IPC messages under heavy load, exchangeMessage()', testHeavyLoad, subprocessExchange);

const testTwice = async (t, exchangeMethod, buffer, filter) => {
	const subprocess = execa('ipc-send.js', {ipc: true, buffer});
	t.deepEqual(
		await Promise.all([exchangeMethod(subprocess, {filter}), exchangeMethod(subprocess, {filter})]),
		[foobarString, foobarString],
	);
	await subprocess;
};

test('subprocess.getOneMessage() can be called twice at the same time, buffer false', testTwice, subprocessGetOne, false, undefined);
test('subprocess.getOneMessage() can be called twice at the same time, buffer true', testTwice, subprocessGetOne, true, undefined);
test('subprocess.getOneMessage() can be called twice at the same time, buffer false, filter', testTwice, subprocessGetOne, false, alwaysPass);
test('subprocess.getOneMessage() can be called twice at the same time, buffer true, filter', testTwice, subprocessGetOne, true, alwaysPass);
test('subprocess.exchangeMessage() can be called twice at the same time, buffer false', testTwice, subprocessExchange, false, undefined);
test('subprocess.exchangeMessage() can be called twice at the same time, buffer true', testTwice, subprocessExchange, true, undefined);
test('subprocess.exchangeMessage() can be called twice at the same time, buffer false, filter', testTwice, subprocessExchange, false, alwaysPass);
test('subprocess.exchangeMessage() can be called twice at the same time, buffer true, filter', testTwice, subprocessExchange, true, alwaysPass);

const testCleanupListeners = async (t, exchangeMethod, buffer, filter) => {
	const subprocess = execa('ipc-send.js', {ipc: true, buffer});

	t.is(subprocess.listenerCount('message'), buffer ? 1 : 0);
	t.is(subprocess.listenerCount('disconnect'), buffer ? 3 : 0);

	const promise = exchangeMethod(subprocess, {filter});
	t.is(subprocess.listenerCount('message'), 1);
	t.is(subprocess.listenerCount('disconnect'), 3);
	t.is(await promise, foobarString);

	t.is(subprocess.listenerCount('message'), 1);
	t.is(subprocess.listenerCount('disconnect'), 3);

	await subprocess;

	t.is(subprocess.listenerCount('message'), 0);
	t.is(subprocess.listenerCount('disconnect'), 0);
};

test('Cleans up subprocess.getOneMessage() listeners, buffer false', testCleanupListeners, subprocessGetOne, false, undefined);
test('Cleans up subprocess.getOneMessage() listeners, buffer true', testCleanupListeners, subprocessGetOne, true, undefined);
test('Cleans up subprocess.getOneMessage() listeners, buffer false, filter', testCleanupListeners, subprocessGetOne, false, alwaysPass);
test('Cleans up subprocess.getOneMessage() listeners, buffer true, filter', testCleanupListeners, subprocessGetOne, true, alwaysPass);
test('Cleans up subprocess.exchangeMessage() listeners, buffer false', testCleanupListeners, subprocessExchange, false, undefined);
test('Cleans up subprocess.exchangeMessage() listeners, buffer true', testCleanupListeners, subprocessExchange, true, undefined);
test('Cleans up subprocess.exchangeMessage() listeners, buffer false, filter', testCleanupListeners, subprocessExchange, false, alwaysPass);
test('Cleans up subprocess.exchangeMessage() listeners, buffer true, filter', testCleanupListeners, subprocessExchange, true, alwaysPass);

const testParentDisconnect = async (t, buffer, filter, exchange) => {
	const fixtureStart = filter ? 'ipc-echo-twice-filter' : 'ipc-echo-twice';
	const fixtureName = exchange ? `${fixtureStart}.js` : `${fixtureStart}-get.js`;
	const subprocess = execa(fixtureName, {ipc: true, buffer});
	await subprocess.sendMessage(foobarString);
	t.is(await subprocess.getOneMessage(), foobarString);

	subprocess.disconnect();

	const {exitCode, isTerminated, message} = await t.throwsAsync(subprocess);
	t.is(exitCode, 1);
	t.false(isTerminated);
	if (buffer) {
		const methodName = exchange ? 'exchangeMessage()' : 'getOneMessage()';
		t.true(message.includes(`Error: ${methodName} could not complete`));
	}
};

test('subprocess.disconnect() interrupts exports.getOneMessage(), buffer false', testParentDisconnect, false, false, false);
test('subprocess.disconnect() interrupts exports.getOneMessage(), buffer true', testParentDisconnect, true, false, false);
test('subprocess.disconnect() interrupts exports.getOneMessage(), buffer false, filter', testParentDisconnect, false, true, false);
test('subprocess.disconnect() interrupts exports.getOneMessage(), buffer true, filter', testParentDisconnect, true, false);
test('subprocess.disconnect() interrupts exports.exchangeMessage(), buffer false', testParentDisconnect, false, false, true);
test('subprocess.disconnect() interrupts exports.exchangeMessage(), buffer true', testParentDisconnect, true, false, true);
test('subprocess.disconnect() interrupts exports.exchangeMessage(), buffer false, filter', testParentDisconnect, false, true, true);
test('subprocess.disconnect() interrupts exports.exchangeMessage(), buffer true, filter', testParentDisconnect, true, true, true);

// eslint-disable-next-line max-params
const testSubprocessDisconnect = async (t, exchangeMethod, methodName, buffer, filter) => {
	const subprocess = execa('empty.js', {ipc: true, buffer});
	const {message} = await t.throwsAsync(exchangeMethod(subprocess, {filter}));
	t.true(message.includes(`subprocess.${methodName}() could not complete`));
	await subprocess;
};

test('Subprocess exit interrupts subprocess.getOneMessage(), buffer false', testSubprocessDisconnect, subprocessGetOne, 'getOneMessage', false, undefined);
test('Subprocess exit interrupts subprocess.getOneMessage(), buffer true', testSubprocessDisconnect, subprocessGetOne, 'getOneMessage', true, undefined);
test('Subprocess exit interrupts subprocess.getOneMessage(), buffer false, filter', testSubprocessDisconnect, subprocessGetOne, 'getOneMessage', false, alwaysPass);
test('Subprocess exit interrupts subprocess.getOneMessage(), buffer true, filter', testSubprocessDisconnect, subprocessGetOne, 'getOneMessage', true, alwaysPass);
test('Subprocess exit interrupts subprocess.exchangeMessage(), buffer false', testSubprocessDisconnect, subprocessExchange, 'exchangeMessage', false, undefined);
test('Subprocess exit interrupts subprocess.exchangeMessage(), buffer true', testSubprocessDisconnect, subprocessExchange, 'exchangeMessage', true, undefined);
test('Subprocess exit interrupts subprocess.exchangeMessage(), buffer false, filter', testSubprocessDisconnect, subprocessExchange, 'exchangeMessage', false, alwaysPass);
test('Subprocess exit interrupts subprocess.exchangeMessage(), buffer true, filter', testSubprocessDisconnect, subprocessExchange, 'exchangeMessage', true, alwaysPass);

const testParentError = async (t, exchangeMethod, filter, buffer) => {
	const subprocess = execa('ipc-send.js', {ipc: true, buffer});

	const promise = exchangeMethod(subprocess, {filter});
	const cause = new Error(foobarString);
	subprocess.emit('error', cause);
	t.is(await promise, foobarString);

	const error = await t.throwsAsync(subprocess);
	t.is(error.exitCode, undefined);
	t.false(error.isTerminated);
	t.is(error.cause, cause);
	if (buffer) {
		t.deepEqual(error.ipcOutput, [foobarString]);
	}
};

test('"error" event does not interrupt subprocess.getOneMessage(), buffer false', testParentError, subprocessGetOne, undefined, false);
test('"error" event does not interrupt subprocess.getOneMessage(), buffer true', testParentError, subprocessGetOne, undefined, true);
test('"error" event does not interrupt subprocess.getOneMessage(), buffer false, filter', testParentError, subprocessGetOne, alwaysPass, false);
test('"error" event does not interrupt subprocess.getOneMessage(), buffer true, filter', testParentError, subprocessGetOne, alwaysPass, true);
test('"error" event does not interrupt subprocess.exchangeMessage(), buffer false', testParentError, subprocessExchange, undefined, false);
test('"error" event does not interrupt subprocess.exchangeMessage(), buffer true', testParentError, subprocessExchange, undefined, true);
test('"error" event does not interrupt subprocess.exchangeMessage(), buffer false, filter', testParentError, subprocessExchange, alwaysPass, false);
test('"error" event does not interrupt subprocess.exchangeMessage(), buffer true, filter', testParentError, subprocessExchange, alwaysPass, true);

const testSubprocessError = async (t, filter, buffer) => {
	const subprocess = execa('ipc-process-error.js', [`${filter}`], {ipc: true, buffer});
	t.is(await subprocess.exchangeMessage(foobarString), foobarString);

	const {ipcOutput} = await subprocess;
	if (buffer) {
		t.deepEqual(ipcOutput, [foobarString]);
	}
};

test('"error" event does not interrupt exports.getOneMessage(), buffer false', testSubprocessError, false, false);
test('"error" event does not interrupt exports.getOneMessage(), buffer true', testSubprocessError, false, true);
test('"error" event does not interrupt exports.getOneMessage(), buffer false, filter', testSubprocessError, true, false);
test('"error" event does not interrupt exports.getOneMessage(), buffer true, filter', testSubprocessError, true, true);

const testSubprocessExchangeError = async (t, filter, buffer) => {
	const subprocess = execa('ipc-process-error-exchange.js', [`${filter}`], {ipc: true, buffer});
	t.is(await subprocess.getOneMessage(), '.');
	t.is(await subprocess.exchangeMessage(foobarString), foobarString);

	const {ipcOutput} = await subprocess;
	if (buffer) {
		t.deepEqual(ipcOutput, ['.', foobarString]);
	}
};

test('"error" event does not interrupt exports.exchangeMessage(), buffer false', testSubprocessExchangeError, false, false);
test('"error" event does not interrupt exports.exchangeMessage(), buffer true', testSubprocessExchangeError, false, true);
test('"error" event does not interrupt exports.exchangeMessage(), buffer false, filter', testSubprocessExchangeError, true, false);
test('"error" event does not interrupt exports.exchangeMessage(), buffer true, filter', testSubprocessExchangeError, true, true);
