import assert from 'node:assert/strict';
import {inspect} from 'node:util';
import test from 'node:test';
import {assertThrows} from '../helpers/assert.js';
import {normalizeStdioOption} from '../../lib/stdio/stdio-option.js';

const stdioMacro = (input, expected) => {
	if (expected instanceof Error) {
		assertThrows(() => {
			normalizeStdioOption(input);
		}, {message: expected.message});
		return;
	}

	assert.deepEqual(normalizeStdioOption(input), expected);
};

const stdioCases = [
	[{stdio: 'inherit'}, ['inherit', 'inherit', 'inherit']],
	[{stdio: 'pipe'}, ['pipe', 'pipe', 'pipe']],
	[{stdio: 'ignore'}, ['ignore', 'ignore', 'ignore']],

	[{}, ['pipe', 'pipe', 'pipe']],
	[{stdio: []}, ['pipe', 'pipe', 'pipe']],
	[{stdio: [0]}, [0, 'pipe', 'pipe']],
	[{stdio: [0, 1]}, [0, 1, 'pipe']],
	[{stdio: [0, 1, 2]}, [0, 1, 2]],
	[{stdio: [0, 1, 2, 3]}, [0, 1, 2, 3]],
	[{stdio: [undefined, 1, 2]}, ['pipe', 1, 2]],
	[{stdio: [null, 1, 2]}, ['pipe', 1, 2]],
	[{stdio: [0, undefined, 2]}, [0, 'pipe', 2]],
	[{stdio: [0, null, 2]}, [0, 'pipe', 2]],
	[{stdio: [0, 1, undefined]}, [0, 1, 'pipe']],
	[{stdio: [0, 1, null]}, [0, 1, 'pipe']],
	[{stdio: [0, 1, 2, undefined]}, [0, 1, 2, 'ignore']],
	[{stdio: [0, 1, 2, null]}, [0, 1, 2, 'ignore']],

	[{stdin: 'pipe'}, ['pipe', 'pipe', 'pipe']],
	[{stdout: 'ignore'}, ['pipe', 'ignore', 'pipe']],
	[{stderr: 'inherit'}, ['pipe', 'pipe', 'inherit']],
	[{stdin: 'pipe', stdout: 'ignore', stderr: 'inherit'}, ['pipe', 'ignore', 'inherit']],
	[{stdin: 'pipe', stdout: 'ignore'}, ['pipe', 'ignore', 'pipe']],
	[{stdin: 'pipe', stderr: 'inherit'}, ['pipe', 'pipe', 'inherit']],
	[{stdout: 'ignore', stderr: 'inherit'}, ['pipe', 'ignore', 'inherit']],
	[{stdin: 0, stdout: 1, stderr: 2}, [0, 1, 2]],
	[{stdin: 0, stdout: 1}, [0, 1, 'pipe']],
	[{stdin: 0, stderr: 2}, [0, 'pipe', 2]],
	[{stdout: 1, stderr: 2}, ['pipe', 1, 2]],

	[{stdio: {foo: 'bar'}}, new TypeError('Expected `stdio` to be of type `string` or `Array`, got `object`')],

	[{stdin: 'inherit', stdio: 'pipe'}, new Error('It\'s not possible to provide `stdio` in combination with one of `stdin`, `stdout`, `stderr`')],
	[{stdin: 'inherit', stdio: ['pipe']}, new Error('It\'s not possible to provide `stdio` in combination with one of `stdin`, `stdout`, `stderr`')],
	[{stdin: 'inherit', stdio: [undefined, 'pipe']}, new Error('It\'s not possible to provide `stdio` in combination with one of `stdin`, `stdout`, `stderr`')],
	[{stdin: 0, stdio: 'pipe'}, new Error('It\'s not possible to provide `stdio` in combination with one of `stdin`, `stdout`, `stderr`')],
];

for (const [input, expected] of stdioCases) {
	test(`execa() ${inspect(input)}`, () => stdioMacro(input, expected));
}
