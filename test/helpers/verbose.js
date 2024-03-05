import {platform} from 'node:process';
import {stripVTControlCharacters} from 'node:util';
import {execa} from '../../index.js';
import {foobarString} from './input.js';

const isWindows = platform === 'win32';
export const QUOTE = isWindows ? '"' : '\'';

// eslint-disable-next-line max-params
export const nestedExeca = (fixtureName, file, args, options, parentOptions) => {
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

export const runWarningProcess = async (t, execaMethod) => {
	const {stderr} = await execaMethod('noop-fail.js', ['1', foobarString], {verbose: 'short', reject: false});
	t.true(stderr.includes('exit code 2'));
	return stderr;
};

export const runEarlyErrorProcess = async (t, execaMethod) => {
	const {stderr} = await t.throwsAsync(execaMethod('noop.js', [foobarString], {verbose: 'short', cwd: true}));
	t.true(stderr.includes('The "cwd" option must'));
	return stderr;
};

export const getCommandLine = stderr => getCommandLines(stderr)[0];
export const getCommandLines = stderr => getNormalizedLines(stderr).filter(line => isCommandLine(line));
const isCommandLine = line => line.includes(' $ ') || line.includes(' | ');
export const getOutputLine = stderr => getOutputLines(stderr)[0];
export const getOutputLines = stderr => getNormalizedLines(stderr).filter(line => isOutputLine(line));
const isOutputLine = line => line.includes(']   ');
export const getErrorLine = stderr => getErrorLines(stderr)[0];
export const getErrorLines = stderr => getNormalizedLines(stderr).filter(line => isErrorLine(line));
const isErrorLine = line => (line.includes(' × ') || line.includes(' ‼ ')) && !isCompletionLine(line);
export const getCompletionLine = stderr => getCompletionLines(stderr)[0];
export const getCompletionLines = stderr => getNormalizedLines(stderr).filter(line => isCompletionLine(line));
const isCompletionLine = line => line.includes('(done in');
export const getNormalizedLines = stderr => splitLines(normalizeStderr(stderr));
const splitLines = stderr => stderr.split('\n');

const normalizeStderr = stderr => normalizeDuration(normalizeTimestamp(stripVTControlCharacters(stderr)));
export const testTimestamp = '[00:00:00.000]';
const normalizeTimestamp = stderr => stderr.replaceAll(/^\[\d{2}:\d{2}:\d{2}.\d{3}]/gm, testTimestamp);
const normalizeDuration = stderr => stderr.replaceAll(/\(done in [^)]+\)/g, '(done in 0ms)');

export const getVerboseOption = (isVerbose, verbose = 'short') => ({verbose: isVerbose ? verbose : 'none'});
