import util from 'util';
import test from 'ava';
import stdio from '../lib/stdio';

util.inspect.styles.name = 'magenta';

function createMacro(func) {
	const macro = (t, input, expected) => {
		if (expected instanceof Error) {
			t.throws(() => {
				stdio(input);
			}, expected.message);
			return;
		}

		const result = func(input);

		if (typeof expected === 'object' && expected !== null) {
			t.deepEqual(result, expected);
		} else {
			t.is(result, expected);
		}
	};

	macro.title = (providedTitle, input) => `${func.name} ${(providedTitle || util.inspect(input, {colors: true}))}`;

	return macro;
}

const stdioMacro = createMacro(stdio);

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

const forkMacro = createMacro(stdio.node);

test(forkMacro, undefined, ['pipe', 'pipe', 'pipe', 'ipc']);
test(forkMacro, {stdio: 'ignore'}, ['ignore', 'ignore', 'ignore', 'ipc']);
test(forkMacro, {stdio: [0, 1, 2]}, [0, 1, 2, 'ipc']);
test(forkMacro, {stdio: [0, 1, 2, 3]}, [0, 1, 2, 3, 'ipc']);
test(forkMacro, {stdio: [0, 1, 2, 'ipc']}, [0, 1, 2, 'ipc']);

test(forkMacro, {stdout: 'ignore'}, ['pipe', 'ignore', 'pipe', 'ipc']);
test(forkMacro, {stdout: 'ignore', stderr: 'ignore'}, ['pipe', 'ignore', 'ignore', 'ipc']);

test(forkMacro, {stdio: {foo: 'bar'}}, new TypeError('Expected `stdio` to be of type `string` or `Array`, got `object`'));
test(forkMacro, {stdin: 'inherit', stdio: 'pipe'}, new Error('It\'s not possible to provide `stdio` in combination with one of `stdin`, `stdout`, `stderr`'));
