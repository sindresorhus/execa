import util from 'util';
import test from 'ava';
import stdio from '../lib/stdio';

util.inspect.styles.name = 'magenta';

function t(input, expected) {
	test(util.inspect(input, {colors: true}), t => {
		const result = stdio(input);

		if (typeof expected === 'object' && expected !== null) {
			t.deepEqual(result, expected);
		} else {
			t.is(result, expected);
		}
	});
}

t(undefined, null);
t(null, null);

t({stdio: 'inherit'}, 'inherit');
t({stdio: 'pipe'}, 'pipe');
t({stdio: 'ignore'}, 'ignore');

t({}, [null, null, null]);
t({stdio: []}, [null, null, null]);
t({stdin: 'pipe'}, ['pipe', null, null]);
t({stdout: 'ignore'}, [null, 'ignore', null]);
t({stderr: 'inherit'}, [null, null, 'inherit']);

// precedence
t({stdin: 'inherit', stdio: 'pipe'}, 'pipe');
t({stdin: 'inherit', stdio: ['pipe']}, ['pipe', null, null]);
t({stdin: 'inherit', stdio: [undefined, 'pipe']}, ['inherit', 'pipe', null]);
