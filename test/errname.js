import test from 'ava';
import errname from '../lib/errname';

const isWin = process.platform === 'win32';
const majorVersion = Number(process.version.substr(1).split('.')[0]);

// simulates failure to capture process.binding('uv');
function fallback(code) {
	return errname.__test__(null, code);
}

function makeTests(name, m, expected) {
	test(`${name}: >=0 exit codes`, t => {
		// throws >= 0
		t.throws(() => m(0), /err >= 0/);
		t.throws(() => m(1), /err >= 0/);
		t.throws(() => m('2'), /err >= 0/);
		t.throws(() => m('foo'), /err >= 0/);
	});

	if (!(isWin && majorVersion < 1)) {
		// causes process.exit() on Node 0.12 for Windows.
		test(`${name}: negative exit codes`, t => {
			t.is(m(-2), expected);
			t.is(m('-2'), expected);
		});
	}
}

const unknown = 'Unknown system error -2';

makeTests('native', errname, isWin ? unknown : 'ENOENT');
makeTests('fallback', fallback, unknown);
