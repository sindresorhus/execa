import {inspect} from 'node:util';
import test from 'ava';
import {normalizeStdio} from '../../lib/stdio/option.js';

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

test(stdioMacro, {stdio: 'inherit'}, ['inherit', 'inherit', 'inherit']);
test(stdioMacro, {stdio: 'pipe'}, ['pipe', 'pipe', 'pipe']);
test(stdioMacro, {stdio: 'ignore'}, ['ignore', 'ignore', 'ignore']);
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
