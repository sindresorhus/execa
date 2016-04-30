import os from 'os';
import test from 'ava';
import errname from '../lib/errname';

const isWin = os.platform() === 'win32';

// simulates failure to capture process.binding('uv');
function fallback(code) {
	return errname.__test__(null, code);
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

const unknown = 'Unknown system error -2';

makeTests('native', errname, isWin ? unknown : 'ENOENT');
makeTests('fallback', fallback, unknown);
