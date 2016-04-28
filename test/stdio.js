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

test(macro, undefined, null);
test(macro, null, null);

test(macro, {stdio: 'inherit'}, 'inherit');
test(macro, {stdio: 'pipe'}, 'pipe');
test(macro, {stdio: 'ignore'}, 'ignore');

test(macro, {}, [null, null, null]);
test(macro, {stdio: []}, [null, null, null]);
test(macro, {stdin: 'pipe'}, ['pipe', null, null]);
test(macro, {stdout: 'ignore'}, [null, 'ignore', null]);
test(macro, {stderr: 'inherit'}, [null, null, 'inherit']);
test(macro, {stdin: 'pipe', stdout: 'ignore', stderr: 'inherit'}, ['pipe', 'ignore', 'inherit']);
test(macro, {stdin: 'pipe', stdout: 'ignore'}, ['pipe', 'ignore', null]);
test(macro, {stdin: 'pipe', stderr: 'inherit'}, ['pipe', null, 'inherit']);
test(macro, {stdout: 'ignore', stderr: 'inherit'}, [null, 'ignore', 'inherit']);

test(macro, {stdio: {foo: 'bar'}}, new TypeError('Expected `stdio` to be of type `string` or `Array`, got `object`'));

test(macro, {stdin: 'inherit', stdio: 'pipe'}, new Error('It\'s not possible to provide `stdio` in combination with one of `stdin`, `stdout`, `stderr`'));
test(macro, {stdin: 'inherit', stdio: ['pipe']}, new Error('It\'s not possible to provide `stdio` in combination with one of `stdin`, `stdout`, `stderr`'));
test(macro, {stdin: 'inherit', stdio: [undefined, 'pipe']}, new Error('It\'s not possible to provide `stdio` in combination with one of `stdin`, `stdout`, `stderr`'));
