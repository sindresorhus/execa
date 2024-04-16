import test from 'ava';
import {execaSync} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {getStdio} from '../helpers/stdio.js';

setFixtureDir();

const getFd3InputMessage = type => `not \`stdio[3]\`, can be ${type}`;

const testFd3InputSync = (t, stdioOption, expectedMessage) => {
	const {message} = t.throws(() => {
		execaSync('empty.js', getStdio(3, stdioOption));
	});
	t.true(message.includes(expectedMessage));
};

test('Cannot use Uint8Array with stdio[*], sync', testFd3InputSync, new Uint8Array(), getFd3InputMessage('a Uint8Array'));
test('Cannot use iterable with stdio[*], sync', testFd3InputSync, [[]], getFd3InputMessage('an iterable'));
