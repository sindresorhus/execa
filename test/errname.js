import test from 'ava';
import errname from '../lib/errname';

const isWindows = process.platform === 'win32';

// Simulates failure to capture `process.binding('uv');`
const fallback = code => errname.__test__(undefined, code);

function makeTests(name, m, expected) {
	test(`${name}: >=0 exit codes`, t => {
		// Throws >= 0
		t.throws(() => m(0), /err >= 0|It must be a negative integer|must be of type negative number/);
		t.throws(() => m(1), /err >= 0|It must be a negative integer|must be of type negative number/);
		t.throws(() => m('2'), /err >= 0|must be of type number|must be of type negative number/);
		t.throws(() => m('foo'), /err >= 0|must be of type number|must be of type negative number/);
	});

	test(`${name}: negative exit codes`, t => {
		t.is(m(-2), expected);
	});
}

const unknown = 'Unknown system error -2';

makeTests('native', errname, isWindows ? unknown : 'ENOENT');
makeTests('fallback', fallback, unknown);
