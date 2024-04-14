import {inspect} from 'node:util';
import test from 'ava';
import {normalizeStdioOption} from '../../lib/stdio/stdio-option.js';

const stdioMacro = (t, input, expected) => {
	if (expected instanceof Error) {
		t.throws(() => {
			normalizeStdioOption(input);
		}, {message: expected.message});
		return;
	}

	t.deepEqual(normalizeStdioOption(input), expected);
};

stdioMacro.title = (_, input) => `execa() ${(inspect(input))}`;

test(stdioMacro, {stdio: 'inherit'}, ['inherit', 'inherit', 'inherit']);
test(stdioMacro, {stdio: 'pipe'}, ['pipe', 'pipe', 'pipe']);
test(stdioMacro, {stdio: 'ignore'}, ['ignore', 'ignore', 'ignore']);

test(stdioMacro, {}, ['pipe', 'pipe', 'pipe']);
test(stdioMacro, {stdio: []}, ['pipe', 'pipe', 'pipe']);
test(stdioMacro, {stdio: [0]}, [0, 'pipe', 'pipe']);
test(stdioMacro, {stdio: [0, 1]}, [0, 1, 'pipe']);
test(stdioMacro, {stdio: [0, 1, 2]}, [0, 1, 2]);
test(stdioMacro, {stdio: [0, 1, 2, 3]}, [0, 1, 2, 3]);
test(stdioMacro, {stdio: [undefined, 1, 2]}, ['pipe', 1, 2]);
test(stdioMacro, {stdio: [null, 1, 2]}, ['pipe', 1, 2]);
test(stdioMacro, {stdio: [0, undefined, 2]}, [0, 'pipe', 2]);
test(stdioMacro, {stdio: [0, null, 2]}, [0, 'pipe', 2]);
test(stdioMacro, {stdio: [0, 1, undefined]}, [0, 1, 'pipe']);
test(stdioMacro, {stdio: [0, 1, null]}, [0, 1, 'pipe']);
test(stdioMacro, {stdio: [0, 1, 2, undefined]}, [0, 1, 2, 'ignore']);
test(stdioMacro, {stdio: [0, 1, 2, null]}, [0, 1, 2, 'ignore']);

test(stdioMacro, {stdin: 'pipe'}, ['pipe', 'pipe', 'pipe']);
test(stdioMacro, {stdout: 'ignore'}, ['pipe', 'ignore', 'pipe']);
test(stdioMacro, {stderr: 'inherit'}, ['pipe', 'pipe', 'inherit']);
test(stdioMacro, {stdin: 'pipe', stdout: 'ignore', stderr: 'inherit'}, ['pipe', 'ignore', 'inherit']);
test(stdioMacro, {stdin: 'pipe', stdout: 'ignore'}, ['pipe', 'ignore', 'pipe']);
test(stdioMacro, {stdin: 'pipe', stderr: 'inherit'}, ['pipe', 'pipe', 'inherit']);
test(stdioMacro, {stdout: 'ignore', stderr: 'inherit'}, ['pipe', 'ignore', 'inherit']);
test(stdioMacro, {stdin: 0, stdout: 1, stderr: 2}, [0, 1, 2]);
test(stdioMacro, {stdin: 0, stdout: 1}, [0, 1, 'pipe']);
test(stdioMacro, {stdin: 0, stderr: 2}, [0, 'pipe', 2]);
test(stdioMacro, {stdout: 1, stderr: 2}, ['pipe', 1, 2]);

test(stdioMacro, {stdio: {foo: 'bar'}}, new TypeError('Expected `stdio` to be of type `string` or `Array`, got `object`'));

test(stdioMacro, {stdin: 'inherit', stdio: 'pipe'}, new Error('It\'s not possible to provide `stdio` in combination with one of `stdin`, `stdout`, `stderr`'));
test(stdioMacro, {stdin: 'inherit', stdio: ['pipe']}, new Error('It\'s not possible to provide `stdio` in combination with one of `stdin`, `stdout`, `stderr`'));
test(stdioMacro, {stdin: 'inherit', stdio: [undefined, 'pipe']}, new Error('It\'s not possible to provide `stdio` in combination with one of `stdin`, `stdout`, `stderr`'));
test(stdioMacro, {stdin: 0, stdio: 'pipe'}, new Error('It\'s not possible to provide `stdio` in combination with one of `stdin`, `stdout`, `stderr`'));
