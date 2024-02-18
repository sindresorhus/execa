import {platform} from 'node:process';
import {stripVTControlCharacters} from 'node:util';
import {execa} from '../../index.js';
import {foobarString} from './input.js';

const isWindows = platform === 'win32';
export const QUOTE = isWindows ? '"' : '\'';

// eslint-disable-next-line max-params
const nestedExeca = (fixtureName, file, args, options, parentOptions) => {
	[args, options = {}, parentOptions = {}] = Array.isArray(args) ? [args, options, parentOptions] : [[], args, options];
	return execa(fixtureName, [JSON.stringify(options), file, ...args], parentOptions);
};

export const nestedExecaAsync = nestedExeca.bind(undefined, 'nested.js');
export const nestedExecaSync = nestedExeca.bind(undefined, 'nested-sync.js');

export const runErrorProcess = async (t, verbose, execaMethod) => {
	const {stderr} = await t.throwsAsync(execaMethod('noop-fail.js', ['1', foobarString], {verbose}));
	t.true(stderr.includes('exit code 2'));
	return stderr;
};

export const runEarlyErrorProcess = async (t, execaMethod) => {
	const {stderr} = await t.throwsAsync(execaMethod('noop.js', [foobarString], {verbose: true, cwd: true}));
	t.true(stderr.includes('The "cwd" option must'));
	return stderr;
};

export const getCommandLine = stderr => getCommandLines(stderr)[0];
export const getCommandLines = stderr => getNormalizedLines(stderr).filter(line => isCommandLine(line));
const isCommandLine = line => line.includes(' $ ') || line.includes(' | ');
export const getNormalizedLines = stderr => splitLines(normalizeStderr(stderr));
const splitLines = stderr => stderr.split('\n');

const normalizeStderr = stderr => normalizeTimestamp(stripVTControlCharacters(stderr));
export const testTimestamp = '[00:00:00.000]';
const normalizeTimestamp = stderr => stderr.replaceAll(/^\[\d{2}:\d{2}:\d{2}.\d{3}]/gm, testTimestamp);
