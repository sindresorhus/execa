import util from 'util';
import test from 'ava';
import stdio from '../lib/stdio';

util.inspect.styles.name = 'magenta';

function macro(t, input, expected) {
	if (expected instanceof Error) {
		t.throws(() => stdio(input), expected.message);
		return;
	}

	const result = stdio(input);

	if (typeof expected === 'object' && expected !== null) {
		t.deepEqual(result, expected);
	} else {
		t.is(result, expected);
	}
}

macro.title = (providedTitle, input) => providedTitle || util.inspect(input, {colors: true});

test(macro, undefined, undefined);
test(macro, null, undefined);

test(macro, {stdio: 'inherit'}, 'inherit');
test(macro, {stdio: 'pipe'}, 'pipe');
test(macro, {stdio: 'ignore'}, 'ignore');
test(macro, {stdio: [0, 1, 2, 3]}, [0, 1, 2, 3]);

test(macro, {}, [undefined, undefined, undefined, undefined]);
test(macro, {stdio: []}, [undefined, undefined, undefined, undefined]);
test(macro, {stdin: 'pipe'}, ['pipe', undefined, undefined, undefined]);
test(macro, {stdout: 'ignore'}, [undefined, 'ignore', undefined, undefined]);
test(macro, {stderr: 'inherit'}, [undefined, undefined, 'inherit', undefined]);
test(macro, {ipc: 'pipe'}, [undefined, undefined, undefined, 'pipe']);
test(macro, {stdin: 'pipe', stdout: 'ignore', stderr: 'inherit'}, ['pipe', 'ignore', 'inherit', undefined]);
test(macro, {stdin: 'pipe', stdout: 'ignore'}, ['pipe', 'ignore', undefined, undefined]);
test(macro, {stdin: 'pipe', stderr: 'inherit'}, ['pipe', undefined, 'inherit', undefined]);
test(macro, {stdout: 'ignore', stderr: 'inherit'}, [undefined, 'ignore', 'inherit', undefined]);
test(macro, {stdin: 0, stdout: 1, stderr: 2}, [0, 1, 2, undefined]);
test(macro, {stdin: 0, stdout: 1}, [0, 1, undefined, undefined]);
test(macro, {stdin: 0, stderr: 2}, [0, undefined, 2, undefined]);
test(macro, {stdout: 1, stderr: 2}, [undefined, 1, 2, undefined]);
test(macro, {ipc: 3, stderr: 2}, [undefined, undefined, 2, 3]);

test(macro, {stdio: {foo: 'bar'}}, new TypeError('Expected `stdio` to be of type `string` or `Array`, got `object`'));

test(macro, {stdin: 'inherit', stdio: 'pipe'}, new Error('It\'s not possible to provide `stdio` in combination with one of `stdin`, `stdout`, `stderr`, `ipc`'));
test(macro, {stdin: 'inherit', stdio: ['pipe']}, new Error('It\'s not possible to provide `stdio` in combination with one of `stdin`, `stdout`, `stderr`, `ipc`'));
test(macro, {stdin: 'inherit', stdio: [undefined, 'pipe']}, new Error('It\'s not possible to provide `stdio` in combination with one of `stdin`, `stdout`, `stderr`, `ipc`'));
