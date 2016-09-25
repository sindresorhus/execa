import test from 'ava';
import errname from '../lib/errname';

const isWin = process.platform === 'win32';

// simulates failure to capture `process.binding('uv');`
const fallback = code => errname.__test__(null, code);

function makeTests(name, m, expected) {
	test(`${name}: >=0 exit codes`, t => {
		// throws >= 0
		t.throws(() => m(0), /err >= 0/);
		t.throws(() => m(1), /err >= 0/);
		t.throws(() => m('2'), /err >= 0/);
		t.throws(() => m('foo'), /err >= 0/);
	});

	test(`${name}: negative exit codes`, t => {
		t.is(m(-2), expected);
		t.is(m('-2'), expected);
	});
}

const unknown = 'Unknown system error -2';

makeTests('native', errname, isWin ? unknown : 'ENOENT');
makeTests('fallback', fallback, unknown);
