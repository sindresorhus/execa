import {platform} from 'node:process';
import {stripVTControlCharacters} from 'node:util';
import {replaceSymbols} from 'figures';
import {foobarString} from './input.js';
import {nestedSubprocess} from './nested.js';

const isWindows = platform === 'win32';
export const QUOTE = isWindows ? '"' : '\'';

export const runErrorSubprocess = async (t, verbose, isSync = false, expectExitCode = true) => {
	const {stderr, nestedResult} = await nestedSubprocess('noop-fail.js', ['1', foobarString], {verbose, isSync});
	t.true(nestedResult instanceof Error);
	if (expectExitCode) {
		t.true(stderr.includes('exit code 2'));
	}

	return stderr;
};

export const runWarningSubprocess = async (t, isSync) => {
	const {stderr, nestedResult} = await nestedSubprocess('noop-fail.js', ['1', foobarString], {verbose: 'short', reject: false, isSync});
	t.true(nestedResult instanceof Error);
	t.true(stderr.includes('exit code 2'));
	return stderr;
};

export const runEarlyErrorSubprocess = async (t, isSync) => {
	const {stderr, nestedResult} = await nestedSubprocess('noop.js', [foobarString], {verbose: 'short', cwd: true, isSync});
	t.true(nestedResult instanceof Error);
	t.true(stderr.includes('The "cwd" option must'));
	return stderr;
};

export const getCommandLine = stderr => getCommandLines(stderr)[0];
export const getCommandLines = stderr => getNormalizedLines(stderr).filter(line => isCommandLine(line));
const isCommandLine = line => line.includes(' $ ') || line.includes(' | ');
export const getOutputLine = stderr => getOutputLines(stderr)[0];
export const getOutputLines = stderr => getNormalizedLines(stderr).filter(line => isOutputLine(line));
const isOutputLine = line => line.includes(']   ');
export const getIpcLine = stderr => getIpcLines(stderr)[0];
export const getIpcLines = stderr => getNormalizedLines(stderr).filter(line => isIpcLine(line));
const isIpcLine = line => line.includes(' * ');
export const getErrorLine = stderr => getErrorLines(stderr)[0];
export const getErrorLines = stderr => getNormalizedLines(stderr).filter(line => isErrorLine(line));
const isErrorLine = line => (line.includes(' × ') || line.includes(' ‼ ')) && !isCompletionLine(line);
export const getCompletionLine = stderr => getCompletionLines(stderr)[0];
export const getCompletionLines = stderr => getNormalizedLines(stderr).filter(line => isCompletionLine(line));
const isCompletionLine = line => line.includes('(done in');
export const getNormalizedLines = stderr => splitLines(normalizeStderr(stderr));
const splitLines = stderr => stderr.split('\n');

const normalizeStderr = stderr => replaceSymbols(normalizeDuration(normalizeTimestamp(stripVTControlCharacters(stderr))), {useFallback: true});
export const testTimestamp = '[00:00:00.000]';
const normalizeTimestamp = stderr => stderr.replaceAll(/^\[\d{2}:\d{2}:\d{2}.\d{3}]/gm, testTimestamp);
const normalizeDuration = stderr => stderr.replaceAll(/\(done in [^)]+\)/g, '(done in 0ms)');

export const getVerboseOption = (isVerbose, verbose = 'short') => ({verbose: isVerbose ? verbose : 'none'});

export const stdoutNoneOption = {stdout: 'none'};
export const stdoutShortOption = {stdout: 'short'};
export const stdoutFullOption = {stdout: 'full'};
export const stderrNoneOption = {stderr: 'none'};
export const stderrShortOption = {stderr: 'short'};
export const stderrFullOption = {stderr: 'full'};
export const fd3NoneOption = {fd3: 'none'};
export const fd3ShortOption = {fd3: 'short'};
export const fd3FullOption = {fd3: 'full'};
export const ipcNoneOption = {ipc: 'none'};
export const ipcShortOption = {ipc: 'short'};
export const ipcFullOption = {ipc: 'full'};
