import {platform} from 'node:process';
import test from 'ava';
import {execa, execaSync} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';

setFixtureDirectory();

const isWindows = platform === 'win32';

const testResultCommand = async (t, expected, ...commandArguments) => {
	const {command: failCommand} = await t.throwsAsync(execa('fail.js', commandArguments));
	t.is(failCommand, `fail.js${expected}`);

	const {command} = await execa('noop.js', commandArguments);
	t.is(command, `noop.js${expected}`);
};

testResultCommand.title = (message, expected) => `result.command is: ${JSON.stringify(expected)}`;

test(testResultCommand, ' foo bar', 'foo', 'bar');
test(testResultCommand, ' baz quz', 'baz', 'quz');
test(testResultCommand, '');

// eslint-disable-next-line max-params
const testEscapedCommand = async (t, commandArguments, expectedUnix, expectedWindows, expectedUnixNoIcu = expectedUnix, expectedWindowsNoIcu = expectedWindows) => {
	// eslint-disable-next-line no-use-extend-native/no-use-extend-native, unicorn/no-nonstandard-builtin-properties -- `RegExp.isMocked` is a static property added by `escape-no-icu.js`, not a native extension
	const expected = RegExp.isMocked
		? (isWindows ? expectedWindowsNoIcu : expectedUnixNoIcu)
		: (isWindows ? expectedWindows : expectedUnix);

	t.like(
		await t.throwsAsync(execa('fail.js', commandArguments)),
		{escapedCommand: `fail.js ${expected}`},
	);

	t.like(t.throws(() => {
		execaSync('fail.js', commandArguments);
	}), {escapedCommand: `fail.js ${expected}`});

	t.like(
		await execa('noop.js', commandArguments),
		{escapedCommand: `noop.js ${expected}`},
	);

	t.like(
		execaSync('noop.js', commandArguments),
		{escapedCommand: `noop.js ${expected}`},
	);
};

test('result.escapedCommand - foo bar', testEscapedCommand, ['foo', 'bar'], 'foo bar', 'foo bar');
test('result.escapedCommand - foo\\ bar', testEscapedCommand, ['foo bar'], '\'foo bar\'', '"foo bar"');
test('result.escapedCommand - "foo"', testEscapedCommand, ['"foo"'], '\'"foo"\'', '"""foo"""');
test('result.escapedCommand - \'foo\'', testEscapedCommand, ['\'foo\''], '\'\'\\\'\'foo\'\\\'\'\'', '"\'foo\'"');
test('result.escapedCommand - "0"', testEscapedCommand, ['0'], '0', '0');
test('result.escapedCommand - 0', testEscapedCommand, [0], '0', '0');
test('result.escapedCommand - *', testEscapedCommand, ['*'], '\'*\'', '"*"');
test('result.escapedCommand - .', testEscapedCommand, ['.'], '.', '.');
test('result.escapedCommand - -', testEscapedCommand, ['-'], '-', '-');
test('result.escapedCommand - _', testEscapedCommand, ['_'], '_', '_');
test('result.escapedCommand - /', testEscapedCommand, ['/'], '/', '/');
test('result.escapedCommand - ,', testEscapedCommand, [','], '\',\'', '","');
test('result.escapedCommand - :', testEscapedCommand, [':'], '\':\'', '":"');
test('result.escapedCommand - ;', testEscapedCommand, [';'], '\';\'', '";"');
test('result.escapedCommand - ~', testEscapedCommand, ['~'], '\'~\'', '"~"');
test('result.escapedCommand - %', testEscapedCommand, ['%'], '\'%\'', '"%"');
test('result.escapedCommand - $', testEscapedCommand, ['$'], '\'$\'', '"$"');
test('result.escapedCommand - !', testEscapedCommand, ['!'], '\'!\'', '"!"');
test('result.escapedCommand - ?', testEscapedCommand, ['?'], '\'?\'', '"?"');
test('result.escapedCommand - #', testEscapedCommand, ['#'], '\'#\'', '"#"');
test('result.escapedCommand - &', testEscapedCommand, ['&'], '\'&\'', '"&"');
test('result.escapedCommand - =', testEscapedCommand, ['='], '\'=\'', '"="');
test('result.escapedCommand - @', testEscapedCommand, ['@'], '\'@\'', '"@"');
test('result.escapedCommand - ^', testEscapedCommand, ['^'], '\'^\'', '"^"');
test('result.escapedCommand - `', testEscapedCommand, ['`'], '\'`\'', '"`"');
test('result.escapedCommand - |', testEscapedCommand, ['|'], '\'|\'', '"|"');
test('result.escapedCommand - +', testEscapedCommand, ['+'], '\'+\'', '"+"');
test('result.escapedCommand - \\', testEscapedCommand, ['\\'], '\'\\\'', '"\\"');
test('result.escapedCommand - ()', testEscapedCommand, ['()'], '\'()\'', '"()"');
test('result.escapedCommand - {}', testEscapedCommand, ['{}'], '\'{}\'', '"{}"');
test('result.escapedCommand - []', testEscapedCommand, ['[]'], '\'[]\'', '"[]"');
test('result.escapedCommand - <>', testEscapedCommand, ['<>'], '\'<>\'', '"<>"');
test('result.escapedCommand - ã', testEscapedCommand, ['ã'], '\'ã\'', '"ã"');
test('result.escapedCommand - \\a', testEscapedCommand, ['\u{7}'], '\'\\u0007\'', '"\\u0007"');
test('result.escapedCommand - \\b', testEscapedCommand, ['\b'], '\'\\b\'', '"\\b"');
test('result.escapedCommand - \\e', testEscapedCommand, ['\u{1B}'], '\'\\u001b\'', '"\\u001b"');
test('result.escapedCommand - \\f', testEscapedCommand, ['\f'], '\'\\f\'', '"\\f"');
test('result.escapedCommand - \\n', testEscapedCommand, ['\n'], '\'\\n\'', '"\\n"');
test('result.escapedCommand - \\r\\n', testEscapedCommand, ['\r\n'], '\'\\r\\n\'', '"\\r\\n"');
test('result.escapedCommand - \\t', testEscapedCommand, ['\t'], '\'\\t\'', '"\\t"');
test('result.escapedCommand - \\v', testEscapedCommand, ['\v'], '\'\\u000b\'', '"\\u000b"');
test('result.escapedCommand - \\x01', testEscapedCommand, ['\u{1}'], '\'\\u0001\'', '"\\u0001"');
test('result.escapedCommand - \\x7f', testEscapedCommand, ['\u{7F}'], '\'\\u007f\'', '"\\u007f"');
test('result.escapedCommand - \\u0085', testEscapedCommand, ['\u{85}'], '\'\\u0085\'', '"\\u0085"');
test('result.escapedCommand - \\u2000', testEscapedCommand, ['\u{2000}'], '\'\\u2000\'', '"\\u2000"');
test('result.escapedCommand - \\u200E', testEscapedCommand, ['\u{200E}'], '\'\\u200e\'', '"\\u200e"', '\'\u{200E}\'', '"\u{200E}"');
test('result.escapedCommand - \\u2028', testEscapedCommand, ['\u{2028}'], '\'\\u2028\'', '"\\u2028"');
test('result.escapedCommand - \\u2029', testEscapedCommand, ['\u{2029}'], '\'\\u2029\'', '"\\u2029"');
test('result.escapedCommand - \\u5555', testEscapedCommand, ['\u{5555}'], '\'\u{5555}\'', '"\u{5555}"');
test('result.escapedCommand - \\uD800', testEscapedCommand, ['\u{D800}'], '\'\\ud800\'', '"\\ud800"', '\'\u{D800}\'', '"\u{D800}"');
test('result.escapedCommand - \\uE000', testEscapedCommand, ['\u{E000}'], '\'\\ue000\'', '"\\ue000"', '\'\u{E000}\'', '"\u{E000}"');
test('result.escapedCommand - \\U1D172', testEscapedCommand, ['\u{1D172}'], '\'\u{1D172}\'', '"\u{1D172}"');
test('result.escapedCommand - \\U1D173', testEscapedCommand, ['\u{1D173}'], '\'\\U1d173\'', '"\\U1d173"', '\'\u{1D173}\'', '"\u{1D173}"');
test('result.escapedCommand - \\U10FFFD', testEscapedCommand, ['\u{10FFFD}'], '\'\\U10fffd\'', '"\\U10fffd"', '\'\u{10FFFD}\'', '"\u{10FFFD}"');
