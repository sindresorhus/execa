import {spawn} from 'node:child_process';
import test from 'ava';
import {isStream} from 'is-stream';
import {$} from '../index.js';
import {setFixtureDir} from './helpers/fixtures-dir.js';
import {foobarString} from './helpers/input.js';

setFixtureDir();

// Workaround since some text editors or IDEs do not allow inputting \r directly
const escapedCall = string => {
	const templates = [string];
	templates.raw = [string];
	return $(templates);
};

const testScriptStdout = async (t, getChildProcess, expectedStdout) => {
	const {stdout} = await getChildProcess();
	t.is(stdout, expectedStdout);
};

test('$ executes command', testScriptStdout, () => $`echo.js foo bar`, 'foo\nbar');
test('$ accepts options', testScriptStdout, () => $({stripFinalNewline: true})`noop.js foo`, 'foo');
test('$ allows number interpolation', testScriptStdout, () => $`echo.js 1 ${2}`, '1\n2');
test('$ can concatenate multiple tokens', testScriptStdout, () => $`echo.js ${'foo'}bar${'foo'}`, 'foobarfoo');
test('$ can use newlines and tab indentations', testScriptStdout, () => $`echo.js foo
	bar`, 'foo\nbar');
test('$ can use newlines and space indentations', testScriptStdout, () => $`echo.js foo
  bar`, 'foo\nbar');
test('$ can use Windows newlines and tab indentations', testScriptStdout, () => escapedCall('echo.js foo\r\n\tbar'), 'foo\nbar');
test('$ can use Windows newlines and space indentations', testScriptStdout, () => escapedCall('echo.js foo\r\n  bar'), 'foo\nbar');
test('$ does not ignore comments in expressions', testScriptStdout, () => $`echo.js foo
	${/* This is a comment */''}
	bar
	${/* This is another comment */''}
	baz
`, 'foo\n\nbar\n\nbaz');
test('$ allows escaping spaces with interpolation', testScriptStdout, () => $`echo.js ${'foo bar'}`, 'foo bar');
test('$ allows escaping spaces in commands with interpolation', testScriptStdout, () => $`${'command with space.js'} foo bar`, 'foo\nbar');
test('$ trims', testScriptStdout, () => $`  echo.js foo bar  `, 'foo\nbar');
test('$ allows array interpolation', testScriptStdout, () => $`echo.js ${['foo', 'bar']}`, 'foo\nbar');
test('$ allows empty array interpolation', testScriptStdout, () => $`echo.js foo ${[]} bar`, 'foo\nbar');
test('$ allows space escaped values in array interpolation', testScriptStdout, () => $`echo.js ${['foo', 'bar baz']}`, 'foo\nbar baz');
test('$ can concatenate at the end of tokens followed by an array', testScriptStdout, () => $`echo.js foo${['bar', 'foo']}`, 'foobar\nfoo');
test('$ can concatenate at the start of tokens followed by an array', testScriptStdout, () => $`echo.js ${['foo', 'bar']}foo`, 'foo\nbarfoo');
test('$ can concatenate at the start and end of tokens followed by an array', testScriptStdout, () => $`echo.js foo${['bar', 'foo']}bar`, 'foobar\nfoobar');
test('$ handles escaped newlines', testScriptStdout, () => $`echo.js a\
b`, 'ab');
test('$ handles backslashes at end of lines', testScriptStdout, () => $`echo.js a\\
 b`, 'a\\\nb');
test('$ handles double backslashes at end of lines', testScriptStdout, () => $`echo.js a\\\\
 b`, 'a\\\\\nb');
test('$ handles tokens - a', testScriptStdout, () => $`echo.js a`, 'a');
test('$ handles expressions - a', testScriptStdout, () => $`echo.js ${'a'}`, 'a');
test('$ handles tokens - abc', testScriptStdout, () => $`echo.js abc`, 'abc');
test('$ handles expressions - abc', testScriptStdout, () => $`echo.js ${'abc'}`, 'abc');
test('$ handles tokens - ""', testScriptStdout, () => $`echo.js`, '');
test('$ handles expressions - ""', testScriptStdout, () => $`echo.js a ${''} b`, 'a\n\nb');
test('$ splits tokens - ""', testScriptStdout, () => $`echo.js ab`, 'ab');
test('$ splits expressions - ""', testScriptStdout, () => $`echo.js ${'a'}${'b'}`, 'ab');
test('$ concatenates expressions - ""', testScriptStdout, () => $`echo.js a${'b'}c`, 'abc');
test('$ handles tokens - " "', testScriptStdout, () => $`echo.js `, '');
test('$ handles expressions - " "', testScriptStdout, () => $`echo.js ${' '}`, ' ');
test('$ splits tokens - " "', testScriptStdout, () => $`echo.js a b`, 'a\nb');
test('$ splits expressions - " "', testScriptStdout, () => $`echo.js ${'a'} ${'b'}`, 'a\nb');
test('$ concatenates tokens - " "', testScriptStdout, () => $`echo.js  a `, 'a');
test('$ concatenates expressions - " "', testScriptStdout, () => $`echo.js  ${'a'} `, 'a');
test('$ handles tokens - "  " (2 spaces)', testScriptStdout, () => $`echo.js  `, '');
test('$ handles expressions - "  " (2 spaces)', testScriptStdout, () => $`echo.js ${'  '}`, '  ');
test('$ splits tokens - "  " (2 spaces)', testScriptStdout, () => $`echo.js a  b`, 'a\nb');
test('$ splits expressions - "  " (2 spaces)', testScriptStdout, () => $`echo.js ${'a'}  ${'b'}`, 'a\nb');
test('$ concatenates tokens - "  " (2 spaces)', testScriptStdout, () => $`echo.js   a  `, 'a');
test('$ concatenates expressions - "  " (2 spaces)', testScriptStdout, () => $`echo.js   ${'a'}  `, 'a');
test('$ handles tokens - "   " (3 spaces)', testScriptStdout, () => $`echo.js   `, '');
test('$ handles expressions - "   " (3 spaces)', testScriptStdout, () => $`echo.js ${'   '}`, '   ');
test('$ splits tokens - "  " (3 spaces)', testScriptStdout, () => $`echo.js a   b`, 'a\nb');
test('$ splits expressions - "   " (3 spaces)', testScriptStdout, () => $`echo.js ${'a'}   ${'b'}`, 'a\nb');
test('$ concatenates tokens - "   " (3 spaces)', testScriptStdout, () => $`echo.js    a   `, 'a');
test('$ concatenates expressions - "   " (3 spaces)', testScriptStdout, () => $`echo.js    ${'a'}   `, 'a');
test('$ handles tokens - \\t (no escape)', testScriptStdout, () => $`echo.js 	`, '');
test('$ handles expressions - \\t (no escape)', testScriptStdout, () => $`echo.js ${'	'}`, '\t');
test('$ splits tokens - \\t (no escape)', testScriptStdout, () => $`echo.js a	b`, 'a\nb');
test('$ splits expressions - \\t (no escape)', testScriptStdout, () => $`echo.js ${'a'}	${'b'}`, 'a\nb');
test('$ concatenates tokens - \\t (no escape)', testScriptStdout, () => $`echo.js 	a	 b`, 'a\nb');
test('$ concatenates expressions - \\t (no escape)', testScriptStdout, () => $`echo.js 	${'a'}	 b`, 'a\nb');
test('$ handles tokens - \\t (escape)', testScriptStdout, () => $`echo.js \t`, '\t');
test('$ handles expressions - \\t (escape)', testScriptStdout, () => $`echo.js ${'\t'}`, '\t');
test('$ splits tokens - \\t (escape)', testScriptStdout, () => $`echo.js a\tb`, 'a\tb');
test('$ splits expressions - \\t (escape)', testScriptStdout, () => $`echo.js ${'a'}\t${'b'}`, 'a\tb');
test('$ concatenates tokens - \\t (escape)', testScriptStdout, () => $`echo.js \ta\t b`, '\ta\t\nb');
test('$ concatenates expressions - \\t (escape)', testScriptStdout, () => $`echo.js \t${'a'}\t b`, '\ta\t\nb');
test('$ handles tokens - \\n (no escape)', testScriptStdout, () => $`echo.js
 `, '');
test('$ handles expressions - \\n (no escape)', testScriptStdout, () => $`echo.js ${`
`} `, '\n');
test('$ splits tokens - \\n (no escape)', testScriptStdout, () => $`echo.js a
 b`, 'a\nb');
test('$ splits expressions - \\n (no escape)', testScriptStdout, () => $`echo.js ${'a'}
 ${'b'}`, 'a\nb');
test('$ concatenates tokens - \\n (no escape)', testScriptStdout, () => $`echo.js
a
 b`, 'a\nb');
test('$ concatenates expressions - \\n (no escape)', testScriptStdout, () => $`echo.js
${'a'}
 b`, 'a\nb');
test('$ handles tokens - \\n (escape)', testScriptStdout, () => $`echo.js \n `, '\n');
test('$ handles expressions - \\n (escape)', testScriptStdout, () => $`echo.js ${'\n'} `, '\n');
test('$ splits tokens - \\n (escape)', testScriptStdout, () => $`echo.js a\n b`, 'a\n\nb');
test('$ splits expressions - \\n (escape)', testScriptStdout, () => $`echo.js ${'a'}\n ${'b'}`, 'a\n\nb');
test('$ concatenates tokens - \\n (escape)', testScriptStdout, () => $`echo.js \na\n b`, '\na\n\nb');
test('$ concatenates expressions - \\n (escape)', testScriptStdout, () => $`echo.js \n${'a'}\n b`, '\na\n\nb');
test('$ handles tokens - \\r (no escape)', testScriptStdout, () => escapedCall('echo.js \r '), '');
test('$ splits tokens - \\r (no escape)', testScriptStdout, () => escapedCall('echo.js a\rb'), 'a\nb');
test('$ splits expressions - \\r (no escape)', testScriptStdout, () => escapedCall(`echo.js ${'a'}\r${'b'}`), 'a\nb');
test('$ concatenates tokens - \\r (no escape)', testScriptStdout, () => escapedCall('echo.js \ra\r b'), 'a\nb');
test('$ concatenates expressions - \\r (no escape)', testScriptStdout, () => escapedCall(`echo.js \r${'a'}\r b`), 'a\nb');
test('$ splits tokens - \\r (escape)', testScriptStdout, () => $`echo.js a\r b`, 'a\r\nb');
test('$ splits expressions - \\r (escape)', testScriptStdout, () => $`echo.js ${'a'}\r ${'b'}`, 'a\r\nb');
test('$ concatenates tokens - \\r (escape)', testScriptStdout, () => $`echo.js \ra\r b`, '\ra\r\nb');
test('$ concatenates expressions - \\r (escape)', testScriptStdout, () => $`echo.js \r${'a'}\r b`, '\ra\r\nb');
test('$ handles tokens - \\r\\n (no escape)', testScriptStdout, () => escapedCall('echo.js \r\n '), '');
test('$ splits tokens - \\r\\n (no escape)', testScriptStdout, () => escapedCall('echo.js a\r\nb'), 'a\nb');
test('$ splits expressions - \\r\\n (no escape)', testScriptStdout, () => escapedCall(`echo.js ${'a'}\r\n${'b'}`), 'a\nb');
test('$ concatenates tokens - \\r\\n (no escape)', testScriptStdout, () => escapedCall('echo.js \r\na\r\n b'), 'a\nb');
test('$ concatenates expressions - \\r\\n (no escape)', testScriptStdout, () => escapedCall(`echo.js \r\n${'a'}\r\n b`), 'a\nb');
test('$ handles tokens - \\r\\n (escape)', testScriptStdout, () => $`echo.js \r\n `, '\r\n');
test('$ handles expressions - \\r\\n (escape)', testScriptStdout, () => $`echo.js ${'\r\n'} `, '\r\n');
test('$ splits tokens - \\r\\n (escape)', testScriptStdout, () => $`echo.js a\r\n b`, 'a\r\n\nb');
test('$ splits expressions - \\r\\n (escape)', testScriptStdout, () => $`echo.js ${'a'}\r\n ${'b'}`, 'a\r\n\nb');
test('$ concatenates tokens - \\r\\n (escape)', testScriptStdout, () => $`echo.js \r\na\r\n b`, '\r\na\r\n\nb');
test('$ concatenates expressions - \\r\\n (escape)', testScriptStdout, () => $`echo.js \r\n${'a'}\r\n b`, '\r\na\r\n\nb');
/* eslint-disable no-irregular-whitespace */
test('$ handles expressions - \\f (no escape)', testScriptStdout, () => $`echo.js ${''}`, '\f');
test('$ splits tokens - \\f (no escape)', testScriptStdout, () => $`echo.js ab`, 'a\fb');
test('$ splits expressions - \\f (no escape)', testScriptStdout, () => $`echo.js ${'a'}${'b'}`, 'a\fb');
test('$ concatenates tokens - \\f (no escape)', testScriptStdout, () => $`echo.js a b`, '\fa\f\nb');
test('$ concatenates expressions - \\f (no escape)', testScriptStdout, () => $`echo.js ${'a'} b`, '\fa\f\nb');
/* eslint-enable no-irregular-whitespace */
test('$ handles tokens - \\f (escape)', testScriptStdout, () => $`echo.js \f`, '\f');
test('$ handles expressions - \\f (escape)', testScriptStdout, () => $`echo.js ${'\f'}`, '\f');
test('$ splits tokens - \\f (escape)', testScriptStdout, () => $`echo.js a\fb`, 'a\fb');
test('$ splits expressions - \\f (escape)', testScriptStdout, () => $`echo.js ${'a'}\f${'b'}`, 'a\fb');
test('$ concatenates tokens - \\f (escape)', testScriptStdout, () => $`echo.js \fa\f b`, '\fa\f\nb');
test('$ concatenates expressions - \\f (escape)', testScriptStdout, () => $`echo.js \f${'a'}\f b`, '\fa\f\nb');
test('$ handles tokens - \\', testScriptStdout, () => $`echo.js \\`, '\\');
test('$ handles expressions - \\', testScriptStdout, () => $`echo.js ${'\\'}`, '\\');
test('$ splits tokens - \\', testScriptStdout, () => $`echo.js a\\b`, 'a\\b');
test('$ splits expressions - \\', testScriptStdout, () => $`echo.js ${'a'}\\${'b'}`, 'a\\b');
test('$ concatenates tokens - \\', testScriptStdout, () => $`echo.js \\a\\ b`, '\\a\\\nb');
test('$ concatenates expressions - \\', testScriptStdout, () => $`echo.js \\${'a'}\\ b`, '\\a\\\nb');
test('$ handles tokens - \\\\', testScriptStdout, () => $`echo.js \\\\`, '\\\\');
test('$ handles expressions - \\\\', testScriptStdout, () => $`echo.js ${'\\\\'}`, '\\\\');
test('$ splits tokens - \\\\', testScriptStdout, () => $`echo.js a\\\\b`, 'a\\\\b');
test('$ splits expressions - \\\\', testScriptStdout, () => $`echo.js ${'a'}\\\\${'b'}`, 'a\\\\b');
test('$ concatenates tokens - \\\\', testScriptStdout, () => $`echo.js \\\\a\\\\ b`, '\\\\a\\\\\nb');
test('$ concatenates expressions - \\\\', testScriptStdout, () => $`echo.js \\\\${'a'}\\\\ b`, '\\\\a\\\\\nb');
test('$ handles tokens - `', testScriptStdout, () => $`echo.js \``, '`');
test('$ handles expressions - `', testScriptStdout, () => $`echo.js ${'`'}`, '`');
test('$ splits tokens - `', testScriptStdout, () => $`echo.js a\`b`, 'a`b');
test('$ splits expressions - `', testScriptStdout, () => $`echo.js ${'a'}\`${'b'}`, 'a`b');
test('$ concatenates tokens - `', testScriptStdout, () => $`echo.js \`a\` b`, '`a`\nb');
test('$ concatenates expressions - `', testScriptStdout, () => $`echo.js \`${'a'}\` b`, '`a`\nb');
test('$ handles tokens - \\v', testScriptStdout, () => $`echo.js \v`, '\v');
test('$ handles expressions - \\v', testScriptStdout, () => $`echo.js ${'\v'}`, '\v');
test('$ splits tokens - \\v', testScriptStdout, () => $`echo.js a\vb`, 'a\vb');
test('$ splits expressions - \\v', testScriptStdout, () => $`echo.js ${'a'}\v${'b'}`, 'a\vb');
test('$ concatenates tokens - \\v', testScriptStdout, () => $`echo.js \va\v b`, '\va\v\nb');
test('$ concatenates expressions - \\v', testScriptStdout, () => $`echo.js \v${'a'}\v b`, '\va\v\nb');
test('$ handles tokens - \\u2028', testScriptStdout, () => $`echo.js \u2028`, '\u2028');
test('$ handles expressions - \\u2028', testScriptStdout, () => $`echo.js ${'\u2028'}`, '\u2028');
test('$ splits tokens - \\u2028', testScriptStdout, () => $`echo.js a\u2028b`, 'a\u2028b');
test('$ splits expressions - \\u2028', testScriptStdout, () => $`echo.js ${'a'}\u2028${'b'}`, 'a\u2028b');
test('$ concatenates tokens - \\u2028', testScriptStdout, () => $`echo.js \u2028a\u2028 b`, '\u2028a\u2028\nb');
test('$ concatenates expressions - \\u2028', testScriptStdout, () => $`echo.js \u2028${'a'}\u2028 b`, '\u2028a\u2028\nb');
test('$ handles tokens - \\a', testScriptStdout, () => $`echo.js \a`, 'a');
test('$ splits tokens - \\a', testScriptStdout, () => $`echo.js a\ab`, 'aab');
test('$ splits expressions - \\a', testScriptStdout, () => $`echo.js ${'a'}\a${'b'}`, 'aab');
test('$ concatenates tokens - \\a', testScriptStdout, () => $`echo.js \aa\a b`, 'aaa\nb');
test('$ concatenates expressions - \\a', testScriptStdout, () => $`echo.js \a${'a'}\a b`, 'aaa\nb');
test('$ handles tokens - \\cJ', testScriptStdout, () => $`echo.js \cJ`, 'cJ');
test('$ splits tokens - \\cJ', testScriptStdout, () => $`echo.js a\cJb`, 'acJb');
test('$ splits expressions - \\cJ', testScriptStdout, () => $`echo.js ${'a'}\cJ${'b'}`, 'acJb');
test('$ concatenates tokens - \\cJ', testScriptStdout, () => $`echo.js \cJa\cJ b`, 'cJacJ\nb');
test('$ concatenates expressions - \\cJ', testScriptStdout, () => $`echo.js \cJ${'a'}\cJ b`, 'cJacJ\nb');
test('$ handles tokens - \\.', testScriptStdout, () => $`echo.js \.`, '.');
test('$ splits tokens - \\.', testScriptStdout, () => $`echo.js a\.b`, 'a.b');
test('$ splits expressions - \\.', testScriptStdout, () => $`echo.js ${'a'}\.${'b'}`, 'a.b');
test('$ concatenates tokens - \\.', testScriptStdout, () => $`echo.js \.a\. b`, '.a.\nb');
test('$ concatenates expressions - \\.', testScriptStdout, () => $`echo.js \.${'a'}\. b`, '.a.\nb');
/* eslint-disable unicorn/no-hex-escape */
test('$ handles tokens - \\x63', testScriptStdout, () => $`echo.js \x63`, 'c');
test('$ splits tokens - \\x63', testScriptStdout, () => $`echo.js a\x63b`, 'acb');
test('$ splits expressions - \\x63', testScriptStdout, () => $`echo.js ${'a'}\x63${'b'}`, 'acb');
test('$ concatenates tokens - \\x63', testScriptStdout, () => $`echo.js \x63a\x63 b`, 'cac\nb');
test('$ concatenates expressions - \\x63', testScriptStdout, () => $`echo.js \x63${'a'}\x63 b`, 'cac\nb');
/* eslint-enable unicorn/no-hex-escape */
test('$ handles tokens - \\u0063', testScriptStdout, () => $`echo.js \u0063`, 'c');
test('$ splits tokens - \\u0063', testScriptStdout, () => $`echo.js a\u0063b`, 'acb');
test('$ splits expressions - \\u0063', testScriptStdout, () => $`echo.js ${'a'}\u0063${'b'}`, 'acb');
test('$ concatenates tokens - \\u0063', testScriptStdout, () => $`echo.js \u0063a\u0063 b`, 'cac\nb');
test('$ concatenates expressions - \\u0063', testScriptStdout, () => $`echo.js \u0063${'a'}\u0063 b`, 'cac\nb');
test('$ handles tokens - \\u{1}', testScriptStdout, () => $`echo.js \u{1}`, '\u0001');
test('$ splits tokens - \\u{1}', testScriptStdout, () => $`echo.js a\u{1}b`, 'a\u0001b');
test('$ splits expressions - \\u{1}', testScriptStdout, () => $`echo.js ${'a'}\u{1}${'b'}`, 'a\u0001b');
test('$ concatenates tokens - \\u{1}', testScriptStdout, () => $`echo.js \u{1}a\u{1} b`, '\u0001a\u0001\nb');
test('$ concatenates expressions - \\u{1}', testScriptStdout, () => $`echo.js \u{1}${'a'}\u{1} b`, '\u0001a\u0001\nb');
test('$ handles tokens - \\u{63}', testScriptStdout, () => $`echo.js \u{63}`, 'c');
test('$ splits tokens - \\u{63}', testScriptStdout, () => $`echo.js a\u{63}b`, 'acb');
test('$ splits expressions - \\u{63}', testScriptStdout, () => $`echo.js ${'a'}\u{63}${'b'}`, 'acb');
test('$ concatenates tokens - \\u{63}', testScriptStdout, () => $`echo.js \u{63}a\u{63} b`, 'cac\nb');
test('$ concatenates expressions - \\u{63}', testScriptStdout, () => $`echo.js \u{63}${'a'}\u{63} b`, 'cac\nb');
test('$ handles tokens - \\u{063}', testScriptStdout, () => $`echo.js \u{063}`, 'c');
test('$ splits tokens - \\u{063}', testScriptStdout, () => $`echo.js a\u{063}b`, 'acb');
test('$ splits expressions - \\u{063}', testScriptStdout, () => $`echo.js ${'a'}\u{063}${'b'}`, 'acb');
test('$ concatenates tokens - \\u{063}', testScriptStdout, () => $`echo.js \u{063}a\u{063} b`, 'cac\nb');
test('$ concatenates expressions - \\u{063}', testScriptStdout, () => $`echo.js \u{063}${'a'}\u{063} b`, 'cac\nb');
test('$ handles tokens - \\u{0063}', testScriptStdout, () => $`echo.js \u{0063}`, 'c');
test('$ splits tokens - \\u{0063}', testScriptStdout, () => $`echo.js a\u{0063}b`, 'acb');
test('$ splits expressions - \\u{0063}', testScriptStdout, () => $`echo.js ${'a'}\u{0063}${'b'}`, 'acb');
test('$ concatenates tokens - \\u{0063}', testScriptStdout, () => $`echo.js \u{0063}a\u{0063} b`, 'cac\nb');
test('$ concatenates expressions - \\u{0063}', testScriptStdout, () => $`echo.js \u{0063}${'a'}\u{0063} b`, 'cac\nb');
test('$ handles tokens - \\u{00063}', testScriptStdout, () => $`echo.js \u{00063}`, 'c');
test('$ splits tokens - \\u{00063}', testScriptStdout, () => $`echo.js a\u{00063}b`, 'acb');
test('$ splits expressions - \\u{00063}', testScriptStdout, () => $`echo.js ${'a'}\u{00063}${'b'}`, 'acb');
test('$ concatenates tokens - \\u{00063}', testScriptStdout, () => $`echo.js \u{00063}a\u{00063} b`, 'cac\nb');
test('$ concatenates expressions - \\u{00063}', testScriptStdout, () => $`echo.js \u{00063}${'a'}\u{00063} b`, 'cac\nb');
test('$ handles tokens - \\u{000063}', testScriptStdout, () => $`echo.js \u{000063}`, 'c');
test('$ splits tokens - \\u{000063}', testScriptStdout, () => $`echo.js a\u{000063}b`, 'acb');
test('$ splits expressions - \\u{000063}', testScriptStdout, () => $`echo.js ${'a'}\u{000063}${'b'}`, 'acb');
test('$ concatenates tokens - \\u{000063}', testScriptStdout, () => $`echo.js \u{000063}a\u{000063} b`, 'cac\nb');
test('$ concatenates expressions - \\u{000063}', testScriptStdout, () => $`echo.js \u{000063}${'a'}\u{000063} b`, 'cac\nb');
test('$ handles tokens - \\u{0000063}', testScriptStdout, () => $`echo.js \u{0000063}`, 'c');
test('$ splits tokens - \\u{0000063}', testScriptStdout, () => $`echo.js a\u{0000063}b`, 'acb');
test('$ splits expressions - \\u{0000063}', testScriptStdout, () => $`echo.js ${'a'}\u{0000063}${'b'}`, 'acb');
test('$ concatenates tokens - \\u{0000063}', testScriptStdout, () => $`echo.js \u{0000063}a\u{0000063} b`, 'cac\nb');
test('$ concatenates expressions - \\u{0000063}', testScriptStdout, () => $`echo.js \u{0000063}${'a'}\u{0000063} b`, 'cac\nb');
test('$ handles tokens - \\u{0063}}', testScriptStdout, () => $`echo.js \u{0063}}`, 'c}');
test('$ splits tokens - \\u{0063}}', testScriptStdout, () => $`echo.js a\u{0063}}b`, 'ac}b');
test('$ splits expressions - \\u{0063}}', testScriptStdout, () => $`echo.js ${'a'}\u{0063}}${'b'}`, 'ac}b');
test('$ concatenates tokens - \\u{0063}}', testScriptStdout, () => $`echo.js \u{0063}}a\u{0063}} b`, 'c}ac}\nb');
test('$ concatenates expressions - \\u{0063}}', testScriptStdout, () => $`echo.js \u{0063}}${'a'}\u{0063}} b`, 'c}ac}\nb');

const testScriptStdoutSync = (t, getChildProcess, expectedStdout) => {
	const {stdout} = getChildProcess();
	t.is(stdout, expectedStdout);
};

test('$.sync', testScriptStdoutSync, () => $.sync`echo.js foo bar`, 'foo\nbar');
test('$.sync can be called $.s', testScriptStdoutSync, () => $.s`echo.js foo bar`, 'foo\nbar');
test('$.sync accepts options', testScriptStdoutSync, () => $({stripFinalNewline: true}).sync`noop.js foo`, 'foo');

const testReturnInterpolate = async (t, getChildProcess, expectedStdout, options = {}) => {
	const foo = await $(options)`echo.js foo`;
	const {stdout} = await getChildProcess(foo);
	t.is(stdout, expectedStdout);
};

test('$ allows execa return value interpolation', testReturnInterpolate, foo => $`echo.js ${foo} bar`, 'foo\nbar');
test('$ allows execa return value buffer interpolation', testReturnInterpolate, foo => $`echo.js ${foo} bar`, 'foo\nbar', {encoding: 'buffer'});
test('$ allows execa return value array interpolation', testReturnInterpolate, foo => $`echo.js ${[foo, 'bar']}`, 'foo\nbar');
test('$ allows execa return value buffer array interpolation', testReturnInterpolate, foo => $`echo.js ${[foo, 'bar']}`, 'foo\nbar', {encoding: 'buffer'});

const testReturnInterpolateSync = (t, getChildProcess, expectedStdout, options = {}) => {
	const foo = $(options).sync`echo.js foo`;
	const {stdout} = getChildProcess(foo);
	t.is(stdout, expectedStdout);
};

test('$.sync allows execa return value interpolation', testReturnInterpolateSync, foo => $.sync`echo.js ${foo} bar`, 'foo\nbar');
test('$.sync allows execa return value buffer interpolation', testReturnInterpolateSync, foo => $.sync`echo.js ${foo} bar`, 'foo\nbar', {encoding: 'buffer'});
test('$.sync allows execa return value array interpolation', testReturnInterpolateSync, foo => $.sync`echo.js ${[foo, 'bar']}`, 'foo\nbar');
test('$.sync allows execa return value buffer array interpolation', testReturnInterpolateSync, foo => $.sync`echo.js ${[foo, 'bar']}`, 'foo\nbar', {encoding: 'buffer'});

const testInvalidSequence = (t, getChildProcess) => {
	t.throws(getChildProcess, {message: /Invalid backslash sequence/});
};

test('$ handles invalid escape sequence - \\1', testInvalidSequence, () => $`echo.js \1`);
test('$ handles invalid escape sequence - \\u', testInvalidSequence, () => $`echo.js \u`);
test('$ handles invalid escape sequence - \\u0', testInvalidSequence, () => $`echo.js \u0`);
test('$ handles invalid escape sequence - \\u00', testInvalidSequence, () => $`echo.js \u00`);
test('$ handles invalid escape sequence - \\u000', testInvalidSequence, () => $`echo.js \u000`);
test('$ handles invalid escape sequence - \\ug', testInvalidSequence, () => $`echo.js \ug`);
test('$ handles invalid escape sequence - \\u{', testInvalidSequence, () => $`echo.js \u{`);
test('$ handles invalid escape sequence - \\u{0000', testInvalidSequence, () => $`echo.js \u{0000`);
test('$ handles invalid escape sequence - \\u{g}', testInvalidSequence, () => $`echo.js \u{g}`);
/* eslint-disable unicorn/no-hex-escape */
test('$ handles invalid escape sequence - \\x', testInvalidSequence, () => $`echo.js \x`);
test('$ handles invalid escape sequence - \\x0', testInvalidSequence, () => $`echo.js \x0`);
test('$ handles invalid escape sequence - \\xgg', testInvalidSequence, () => $`echo.js \xgg`);
/* eslint-enable unicorn/no-hex-escape */

const testEmptyScript = (t, getChildProcess) => {
	t.throws(getChildProcess, {message: /Template script must not be empty/});
};

test('$``', testEmptyScript, () => $``);
test('$` `', testEmptyScript, () => $` `);
test('$`  ` (2 spaces)', testEmptyScript, () => $`  `);
test('$`\\t`', testEmptyScript, () => $`	`);
test('$`\\n`', testEmptyScript, () => $`
`);

test('$.sync must be used after options binding, not before', t => {
	t.throws(() => $.sync({})`noop.js`, {message: /Please use/});
});

test('$ must only use options or templates', t => {
	t.throws(() => $(true)`noop.js`, {message: /Please use either/});
});

test('$.sync must only templates', t => {
	t.throws(() => $.sync(true)`noop.js`, {message: /A template string must be used/});
});

const testInvalidExpression = (t, invalidExpression, execaMethod) => {
	const expression = typeof invalidExpression === 'function' ? invalidExpression() : invalidExpression;
	t.throws(
		() => execaMethod`echo.js ${expression}`,
		{message: /in template expression/},
	);
};

test('$ throws on invalid expression - undefined', testInvalidExpression, undefined, $);
test('$ throws on invalid expression - null', testInvalidExpression, null, $);
test('$ throws on invalid expression - true', testInvalidExpression, true, $);
test('$ throws on invalid expression - {}', testInvalidExpression, {}, $);
test('$ throws on invalid expression - {foo: "bar"}', testInvalidExpression, {foo: 'bar'}, $);
test('$ throws on invalid expression - {stdout: undefined}', testInvalidExpression, {stdout: undefined}, $);
test('$ throws on invalid expression - {stdout: 1}', testInvalidExpression, {stdout: 1}, $);
test('$ throws on invalid expression - Promise.resolve()', testInvalidExpression, Promise.resolve(), $);
test('$ throws on invalid expression - Promise.resolve({stdout: "foo"})', testInvalidExpression, Promise.resolve({foo: 'bar'}), $);
test('$ throws on invalid expression - $', testInvalidExpression, () => $`noop.js`, $);
test('$ throws on invalid expression - $(options).sync', testInvalidExpression, () => $({stdio: 'ignore'}).sync`noop.js`, $);
test('$ throws on invalid expression - [undefined]', testInvalidExpression, [undefined], $);
test('$ throws on invalid expression - [null]', testInvalidExpression, [null], $);
test('$ throws on invalid expression - [true]', testInvalidExpression, [true], $);
test('$ throws on invalid expression - [{}]', testInvalidExpression, [{}], $);
test('$ throws on invalid expression - [{foo: "bar"}]', testInvalidExpression, [{foo: 'bar'}], $);
test('$ throws on invalid expression - [{stdout: undefined}]', testInvalidExpression, [{stdout: undefined}], $);
test('$ throws on invalid expression - [{stdout: 1}]', testInvalidExpression, [{stdout: 1}], $);
test('$ throws on invalid expression - [Promise.resolve()]', testInvalidExpression, [Promise.resolve()], $);
test('$ throws on invalid expression - [Promise.resolve({stdout: "foo"})]', testInvalidExpression, [Promise.resolve({stdout: 'foo'})], $);
test('$ throws on invalid expression - [$]', testInvalidExpression, () => [$`noop.js`], $);
test('$ throws on invalid expression - [$(options).sync]', testInvalidExpression, () => [$({stdio: 'ignore'}).sync`noop.js`], $);

test('$ stdin defaults to "inherit"', async t => {
	const {stdout} = await $({input: 'foo'})`stdin-script.js`;
	t.is(stdout, 'foo');
});

test('$.sync stdin defaults to "inherit"', t => {
	const {stdout} = $({input: 'foo'}).sync`stdin-script.js`;
	t.is(stdout, 'foo');
});

test('$ stdin has no default value when stdio is set', t => {
	t.true(isStream($({stdio: 'pipe'})`noop.js`.stdin));
});

test('$.pipe(childProcess)', async t => {
	const {stdout} = await $`noop.js ${foobarString}`.pipe($({stdin: 'pipe'})`stdin.js`);
	t.is(stdout, foobarString);
});

test('$.pipe`command`', async t => {
	const {stdout} = await $`noop.js ${foobarString}`.pipe`stdin.js`;
	t.is(stdout, foobarString);
});

test('$.pipe(childProcess, pipeOptions)', async t => {
	const {stdout} = await $`noop-fd.js 2 ${foobarString}`.pipe($({stdin: 'pipe'})`stdin.js`, {from: 'stderr'});
	t.is(stdout, foobarString);
});

test('$.pipe(pipeOptions)`command`', async t => {
	const {stdout} = await $`noop-fd.js 2 ${foobarString}`.pipe({from: 'stderr'})`stdin.js`;
	t.is(stdout, foobarString);
});

test('$.pipe(options)`command`', async t => {
	const {stdout} = await $`noop.js ${foobarString}`.pipe({stripFinalNewline: false})`stdin.js`;
	t.is(stdout, `${foobarString}\n`);
});

test('$.pipe(pipeAndProcessOptions)`command`', async t => {
	const {stdout} = await $`noop-fd.js 2 ${foobarString}\n`.pipe({from: 'stderr', stripFinalNewline: false})`stdin.js`;
	t.is(stdout, `${foobarString}\n`);
});

test('$.pipe(options)(secondOptions)`command`', async t => {
	const {stdout} = await $`noop.js ${foobarString}`.pipe({stripFinalNewline: false})({stripFinalNewline: true})`stdin.js`;
	t.is(stdout, foobarString);
});

test('$.pipe(options)(childProcess) fails', t => {
	t.throws(() => {
		$`empty.js`.pipe({stdout: 'pipe'})($`empty.js`);
	}, {message: /Please use \.pipe/});
});

const testInvalidPipe = (t, ...args) => {
	t.throws(() => {
		$`empty.js`.pipe(...args);
	}, {message: /must be a template string/});
};

test('$.pipe(nonExecaChildProcess) fails', testInvalidPipe, spawn('node', ['--version']));
test('$.pipe(false) fails', testInvalidPipe, false);
