import test from 'ava';
import {execa, execaSync} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';

setFixtureDirectory();

const VALIDATION_MESSAGES = {
	string: 'this signal name does not exist',
	integer: 'this signal integer does not exist',
	other: 'it must be a string or an integer',
	rename: 'please rename it to',
	zero: '0 cannot be used',
};

const validateMessage = (t, message, type) => {
	t.true(message.includes(VALIDATION_MESSAGES[type]));

	if (type !== 'rename' && type !== 'zero') {
		t.true(message.includes('Available signal names: \'SIGABRT\', '));
		t.true(message.includes('Available signal numbers: 1, '));
	}
};

const testInvalidKillSignal = (t, killSignal, type, execaMethod) => {
	const {message} = t.throws(() => {
		execaMethod('empty.js', {killSignal});
	});
	t.true(message.includes('Invalid option `killSignal`'));
	validateMessage(t, message, type);
};

test('Cannot use killSignal: "SIGOTHER"', testInvalidKillSignal, 'SIGOTHER', 'string', execa);
test('Cannot use killSignal: "Sigterm"', testInvalidKillSignal, 'Sigterm', 'rename', execa);
test('Cannot use killSignal: "sigterm"', testInvalidKillSignal, 'sigterm', 'rename', execa);
test('Cannot use killSignal: -1', testInvalidKillSignal, -1, 'integer', execa);
test('Cannot use killSignal: 200', testInvalidKillSignal, 200, 'integer', execa);
test('Cannot use killSignal: 1n', testInvalidKillSignal, 1n, 'other', execa);
test('Cannot use killSignal: 1.5', testInvalidKillSignal, 1.5, 'other', execa);
test('Cannot use killSignal: Infinity', testInvalidKillSignal, Number.POSITIVE_INFINITY, 'other', execa);
test('Cannot use killSignal: NaN', testInvalidKillSignal, Number.NaN, 'other', execa);
test('Cannot use killSignal: false', testInvalidKillSignal, false, 'other', execa);
test('Cannot use killSignal: null', testInvalidKillSignal, null, 'other', execa);
test('Cannot use killSignal: symbol', testInvalidKillSignal, Symbol('test'), 'other', execa);
test('Cannot use killSignal: {}', testInvalidKillSignal, {}, 'other', execa);
test('Cannot use killSignal: 0', testInvalidKillSignal, 0, 'zero', execa);
test('Cannot use killSignal: "SIGOTHER", sync', testInvalidKillSignal, 'SIGOTHER', 'string', execaSync);
test('Cannot use killSignal: "Sigterm", sync', testInvalidKillSignal, 'Sigterm', 'rename', execaSync);
test('Cannot use killSignal: "sigterm", sync', testInvalidKillSignal, 'sigterm', 'rename', execaSync);
test('Cannot use killSignal: -1, sync', testInvalidKillSignal, -1, 'integer', execaSync);
test('Cannot use killSignal: 200, sync', testInvalidKillSignal, 200, 'integer', execaSync);
test('Cannot use killSignal: 1.5, sync', testInvalidKillSignal, 1.5, 'other', execaSync);
test('Cannot use killSignal: Infinity, sync', testInvalidKillSignal, Number.POSITIVE_INFINITY, 'other', execaSync);
test('Cannot use killSignal: NaN, sync', testInvalidKillSignal, Number.NaN, 'other', execaSync);
test('Cannot use killSignal: null, sync', testInvalidKillSignal, null, 'other', execaSync);
test('Cannot use killSignal: symbol, sync', testInvalidKillSignal, Symbol('test'), 'other', execaSync);
test('Cannot use killSignal: {}, sync', testInvalidKillSignal, {}, 'other', execaSync);
test('Cannot use killSignal: 0, sync', testInvalidKillSignal, 0, 'zero', execaSync);

const testInvalidSignalArgument = async (t, signal, type) => {
	const subprocess = execa('empty.js');
	const {message} = t.throws(() => {
		subprocess.kill(signal);
	});

	if (type === 'other') {
		t.true(message.includes('must be an error instance or a signal name string/integer'));
	} else {
		t.true(message.includes('Invalid `subprocess.kill()`\'s argument'));
		validateMessage(t, message, type);
	}

	await subprocess;
};

test('Cannot use subprocess.kill("SIGOTHER")', testInvalidSignalArgument, 'SIGOTHER', 'string');
test('Cannot use subprocess.kill("Sigterm")', testInvalidSignalArgument, 'Sigterm', 'rename');
test('Cannot use subprocess.kill("sigterm")', testInvalidSignalArgument, 'sigterm', 'rename');
test('Cannot use subprocess.kill(-1)', testInvalidSignalArgument, -1, 'integer');
test('Cannot use subprocess.kill(200)', testInvalidSignalArgument, 200, 'integer');
test('Cannot use subprocess.kill(1n)', testInvalidSignalArgument, 1n, 'other');
test('Cannot use subprocess.kill(1.5)', testInvalidSignalArgument, 1.5, 'other');
test('Cannot use subprocess.kill(Infinity)', testInvalidSignalArgument, Number.POSITIVE_INFINITY, 'other');
test('Cannot use subprocess.kill(NaN)', testInvalidSignalArgument, Number.NaN, 'other');
test('Cannot use subprocess.kill(false)', testInvalidSignalArgument, false, 'other');
test('Cannot use subprocess.kill(null)', testInvalidSignalArgument, null, 'other');
test('Cannot use subprocess.kill(symbol)', testInvalidSignalArgument, Symbol('test'), 'other');
test('Cannot use subprocess.kill({})', testInvalidSignalArgument, {}, 'other');
