import test from 'ava';
import errname from '../lib/errname';

// simulates failure to capture process.binding('uv');
function fallback(code) {
	return errname._test(null, code);
}

function makeTests(name, m, expected) {
	test(name, t => {
		// throws >= 0
		t.throws(() => m(0), /err >= 0/);
		t.throws(() => m(1), /err >= 0/);
		t.throws(() => m('2'), /err >= 0/);
		t.throws(() => m('foo'), /err >= 0/);

		t.is(m(-2), expected);
		t.is(m('-2'), expected);
	});
}

makeTests('native', errname, 'ENOENT');
makeTests('fallback', fallback, 'UNKNOWN CODE: -2');
