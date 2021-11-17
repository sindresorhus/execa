import {inspect} from 'node:util';
import test from 'ava';
import {normalizeStdio, normalizeStdioNode} from '../lib/stdio.js';

const macro = (t, input, expected, func) => {
	if (expected instanceof Error) {
		t.throws(() => {
			normalizeStdio(input);
		}, {message: expected.message});
		return;
	}

	t.deepEqual(func(input), expected);
};

const macroTitle = name => (title, input) => `${name} ${(inspect(input))}`;

const stdioMacro = (...args) => macro(...args, normalizeStdio);
stdioMacro.title = macroTitle('execa()');

test(stdioMacro, undefined, undefined);
test(stdioMacro, null, undefined);

test(stdioMacro, {stdio: 'inherit'}, 'inherit');
test(stdioMacro, {stdio: 'pipe'}, 'pipe');
test(stdioMacro, {stdio: 'ignore'}, 'ignore');
test(stdioMacro, {stdio: [0, 1, 2]}, [0, 1, 2]);

test(stdioMacro, {}, [undefined, undefined, undefined]);
test(stdioMacro, {stdio: []}, [undefined, undefined, undefined]);
test(stdioMacro, {stdin: 'pipe'}, ['pipe', undefined, undefined]);
test(stdioMacro, {stdout: 'ignore'}, [undefined, 'ignore', undefined]);
test(stdioMacro, {stderr: 'inherit'}, [undefined, undefined, 'inherit']);
test(stdioMacro, {stdin: 'pipe', stdout: 'ignore', stderr: 'inherit'}, ['pipe', 'ignore', 'inherit']);
test(stdioMacro, {stdin: 'pipe', stdout: 'ignore'}, ['pipe', 'ignore', undefined]);
test(stdioMacro, {stdin: 'pipe', stderr: 'inherit'}, ['pipe', undefined, 'inherit']);
test(stdioMacro, {stdout: 'ignore', stderr: 'inherit'}, [undefined, 'ignore', 'inherit']);
test(stdioMacro, {stdin: 0, stdout: 1, stderr: 2}, [0, 1, 2]);
test(stdioMacro, {stdin: 0, stdout: 1}, [0, 1, undefined]);
test(stdioMacro, {stdin: 0, stderr: 2}, [0, undefined, 2]);
test(stdioMacro, {stdout: 1, stderr: 2}, [undefined, 1, 2]);

test(stdioMacro, {stdio: {foo: 'bar'}}, new TypeError('Expected `stdio` to be of type `string` or `Array`, got `object`'));

test(stdioMacro, {stdin: 'inherit', stdio: 'pipe'}, new Error('It\'s not possible to provide `stdio` in combination with one of `stdin`, `stdout`, `stderr`'));
test(stdioMacro, {stdin: 'inherit', stdio: ['pipe']}, new Error('It\'s not possible to provide `stdio` in combination with one of `stdin`, `stdout`, `stderr`'));
test(stdioMacro, {stdin: 'inherit', stdio: [undefined, 'pipe']}, new Error('It\'s not possible to provide `stdio` in combination with one of `stdin`, `stdout`, `stderr`'));
test(stdioMacro, {stdin: 0, stdio: 'pipe'}, new Error('It\'s not possible to provide `stdio` in combination with one of `stdin`, `stdout`, `stderr`'));

const forkMacro = (...args) => macro(...args, normalizeStdioNode);
forkMacro.title = macroTitle('execaNode()');

test(forkMacro, undefined, [undefined, undefined, undefined, 'ipc']);
test(forkMacro, {stdio: 'ignore'}, ['ignore', 'ignore', 'ignore', 'ipc']);
test(forkMacro, {stdio: 'ipc'}, 'ipc');
test(forkMacro, {stdio: [0, 1, 2]}, [0, 1, 2, 'ipc']);
test(forkMacro, {stdio: [0, 1, 2, 3]}, [0, 1, 2, 3, 'ipc']);
test(forkMacro, {stdio: [0, 1, 2, 'ipc']}, [0, 1, 2, 'ipc']);

test(forkMacro, {stdio: [0, 1, undefined]}, [0, 1, undefined, 'ipc']);
test(forkMacro, {stdio: [0, 1, 2, undefined]}, [0, 1, 2, undefined, 'ipc']);
test(forkMacro, {stdout: 'ignore'}, [undefined, 'ignore', undefined, 'ipc']);
test(forkMacro, {stdout: 'ignore', stderr: 'ignore'}, [undefined, 'ignore', 'ignore', 'ipc']);

test(forkMacro, {stdio: {foo: 'bar'}}, new TypeError('Expected `stdio` to be of type `string` or `Array`, got `object`'));
test(forkMacro, {stdin: 'inherit', stdio: 'pipe'}, new Error('It\'s not possible to provide `stdio` in combination with one of `stdin`, `stdout`, `stderr`'));
