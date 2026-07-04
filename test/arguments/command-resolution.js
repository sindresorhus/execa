import {cp, mkdir} from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import test from 'ava';
import {execa, execaSync} from '../../index.js';
import {setFixtureDirectory, FIXTURES_DIRECTORY} from '../helpers/fixtures-directory.js';

setFixtureDirectory();

const isWindows = process.platform === 'win32';

// These tests cover the command resolution and argument escaping performed by
// `lib/arguments/command-file.js`, which allows running scripts, `.cmd`/`.bat` files
// and shebang scripts without a shell, and prevents command injection on Windows.
// Most assertions use a roundtrip: an argument is passed in, the subprocess prints
// its own `process.argv` back (see `test/fixtures/echo.js`), and we check it comes
// back byte-identical. This exercises the escaping logic on whichever OS runs the
// test, so Windows escaping is genuinely validated on CI.

// `echo.js` prints `process.argv.slice(2).join('\n')`
const testRoundtrip = async (t, commandArguments) => {
	const expectedStdout = commandArguments.map(String).join('\n');

	const {stdout} = await execa('echo.js', commandArguments);
	t.is(stdout, expectedStdout);

	const {stdout: stdoutSync} = execaSync('echo.js', commandArguments);
	t.is(stdoutSync, expectedStdout);
};

test('Empty arguments and arguments with spaces', testRoundtrip, ['foo', '', 'bar', 'André Cruz']);
test('Non-string arguments are coerced', testRoundtrip, [1234]);
test('Arguments with shell special characters', testRoundtrip, [
	'foo',
	'()',
	'foo',
	'[]',
	'foo',
	'%!',
	'foo',
	'^<',
	'foo',
	'>&',
	'foo',
	'|;',
	'foo',
	', ',
	'foo',
	'!=',
	'foo',
	'\\*',
	'foo',
	'"f"',
	'foo',
	'?.',
	'foo',
	'=`',
	'foo',
	'\'',
	'foo',
	'\\"',
	'bar\\',
	'"foo|bar>baz"',
	'"(foo|bar>baz|foz)"',
]);
// Backslashes and double quotes need specific escaping on Windows, so their combinations are the trickiest.
test('Arguments with backslashes', testRoundtrip, ['a\\b', 'a\\\\b', '\\', '\\\\', 'a\\', 'trailing\\']);
test('Arguments with backslashes and double quotes', testRoundtrip, ['a\\"b', '\\"', 'a"\\', '\\\\"', '"\\\\"']);
// Backslashes, double quotes and shell metacharacters combined in a single argument are the trickiest to escape on Windows.
test('Arguments combining backslashes, quotes and metacharacters', testRoundtrip, ['a\\"&b', '\\"()\\', 'c\\\\"|d', '%x%\\', '">&<"']);
test('Arguments with tabs and whitespace', testRoundtrip, ['a\tb', '\t', '   spaces   ', ' ']);
// Several consecutive empty and whitespace-only arguments must each be preserved as a distinct argument.
test('Arguments that are empty or whitespace-only', testRoundtrip, ['', '', 'a', '', ' ', '\t', '']);
test('Arguments that look like flags', testRoundtrip, ['-e', '--foo=bar', '--', '-']);
test('Arguments with Unicode characters', testRoundtrip, ['café', '🎉', '日本語', 'naïve']);
// eslint-disable-next-line no-template-curly-in-string
test('Arguments with shell variable syntax', testRoundtrip, ['$HOME', '${x}', '~', 'a=b,c', '`whoami`']);
// Very long arguments must not be truncated nor corrupted by the escaping.
test('Very long arguments', testRoundtrip, ['a'.repeat(10_000), `${'b'.repeat(1000)}\\"${'c'.repeat(1000)}`]);
// A long run of consecutive backslashes right before a double quote (or the end of the
// argument) must be doubled as a whole. This is both the input a length-dependent escaping
// bug corrupts and the one a naive regex backtracks quadratically over, so a correct
// roundtrip here guards correctness and the single-pass linear escaping at once.
test('Arguments with long runs of backslashes before quotes', testRoundtrip, [
	`${'\\'.repeat(1000)}"`,
	'\\'.repeat(1000),
	`a${'\\'.repeat(500)}"b${'\\'.repeat(500)}`,
]);
// Runs of backslashes of every length from 1 to 6, each right before a double quote, then
// each at the very end of the argument. The bug this guards against doubled only the last
// backslash of a run instead of the whole run, so it corrupted every length above 1.
// Passing each length as its own argument pins down exactly which lengths would break.
const backslashRunArguments = [
	...Array.from({length: 6}, (_, index) => `${'\\'.repeat(index + 1)}"x`),
	...Array.from({length: 6}, (_, index) => `end${'\\'.repeat(index + 1)}`),
];
test('Arguments with backslash runs of every length', testRoundtrip, backslashRunArguments);
// Consecutive double quotes must each be escaped independently, not collapsed nor paired.
test('Arguments with consecutive double quotes', testRoundtrip, ['""', '"""', 'a""b', '""""']);
// A line break can be passed as an argument to a directly executable file (unlike a `.cmd`
// on Windows, see below). `echo-argv.js` prints its arguments as JSON, so this verifies the
// line break stays within a single argument rather than splitting it in two.
test('Line breaks are kept within a single argument for executables', async t => {
	const commandArguments = ['a\nb', 'a\r\nb', 'c'];
	const {stdout} = await execa('echo-argv.js', commandArguments);
	t.deepEqual(JSON.parse(stdout), commandArguments);

	const {stdout: stdoutSync} = execaSync('echo-argv.js', commandArguments);
	t.deepEqual(JSON.parse(stdoutSync), commandArguments);
});

// A command can be resolved from different kinds of file paths. Forward slashes
// work even on Windows, where they are normalized to backslashes.
const testResolvesCommand = async (t, file, options) => {
	const {stdout} = await execa(file, ['foo'], options);
	t.is(stdout, 'foo');

	const {stdout: stdoutSync} = execaSync(file, ['foo'], options);
	t.is(stdoutSync, 'foo');
};

test('Runs a command given as an absolute path', testResolvesCommand, path.join(FIXTURES_DIRECTORY, 'echo.js'));
test('Runs a command given as a relative path with a custom cwd', testResolvesCommand, './echo.js', {cwd: FIXTURES_DIRECTORY});
test('Runs a command given as a relative POSIX-style subpath', testResolvesCommand, 'test/fixtures/echo.js');
test('Runs a command whose path contains a space', testResolvesCommand, 'command with space.js');
test('Runs a command whose absolute path contains a space', testResolvesCommand, path.join(FIXTURES_DIRECTORY, 'command with space.js'));

// A shebang script can be run without explicitly prepending its interpreter.
// This is emulated on Windows, where shebangs are not natively supported.
// The whole test suite implicitly relies on this (e.g. `echo.js`), so we assert it explicitly.
test('Runs a shebang script without specifying its interpreter', async t => {
	const {stdout} = await execa('echo.js', ['foo']);
	t.is(stdout, 'foo');

	const {stdout: stdoutSync} = execaSync('echo.js', ['foo']);
	t.is(stdoutSync, 'foo');
});

// A space between `#!` and the interpreter path (e.g. `#! /usr/bin/env node`) is a valid,
// real-world shebang variation. The reimplemented shebang parser must trim it, otherwise
// on Windows the interpreter would resolve as ` /usr/bin/env` and fail with ENOENT.
test('Runs a shebang script with a space after the "#!"', async t => {
	const {stdout} = await execa('echo-space-shebang.js', ['foo']);
	t.is(stdout, 'foo');

	const {stdout: stdoutSync} = execaSync('echo-space-shebang.js', ['foo']);
	t.is(stdoutSync, 'foo');
});

// Neither the caller's arguments array nor its options object should be mutated,
// whether or not a shell is used (each path clones the arguments internally).
const testNoMutation = async (t, options) => {
	const commandArguments = ['foo', 'bar'];
	const optionsCopy = {...options};

	await execa('echo.js', commandArguments, options);
	t.deepEqual(commandArguments, ['foo', 'bar']);
	t.deepEqual(options, optionsCopy);

	execaSync('echo.js', commandArguments, options);
	t.deepEqual(commandArguments, ['foo', 'bar']);
	t.deepEqual(options, optionsCopy);
};

test('Does not mutate arguments nor options', testNoMutation, {});
test('Does not mutate arguments nor options with a shell', testNoMutation, {shell: true});

if (isWindows) {
	// A bare command name without an extension is resolved using `PATHEXT`.
	test('Resolves command extension using PATHEXT (sync)', t => {
		const {stdout} = execaSync('hello');
		t.is(stdout, 'Hello World');
	});

	// A `.cmd` file needs `cmd.exe`, so its forward-slash path must be normalized to
	// backslashes, otherwise it fails with ENOENT.
	test('Runs a .cmd file given as a relative POSIX-style subpath', async t => {
		const {stdout} = await execa('fixtures/hello.cmd', {cwd: path.join(FIXTURES_DIRECTORY, '..')});
		t.is(stdout, 'Hello World');
	});

	/*
	Metacharacters are double-escaped for batch files, since `cmd.exe` interprets them once when the batch file is invoked and once when it re-expands the arguments with `%*`.
	The `cmd`-shims npm generates in `node_modules/.bin/` are the canonical example.
	*/
	const setupCmdShim = async () => {
		const binaryDirectory = path.join(FIXTURES_DIRECTORY, 'node_modules', '.bin');
		await mkdir(binaryDirectory, {recursive: true});
		const shimPath = path.join(binaryDirectory, 'echo-cmd-shim.cmd');
		await cp(path.join(FIXTURES_DIRECTORY, 'echo-cmd-shim.cmd'), shimPath);
		return shimPath;
	};

	test('Double-escapes metacharacters for node_modules/.bin cmd-shims', async t => {
		const shimPath = await setupCmdShim();
		const commandArgument = '"(foo|bar>baz|foz)"';
		const {stdout} = await execa(shimPath, [commandArgument]);
		t.is(stdout, commandArgument);

		const {stdout: stdoutSync} = execaSync(shimPath, [commandArgument]);
		t.is(stdoutSync, commandArgument);
	});
}

// On Windows, `.cmd`/`.bat` files are run through `cmd.exe`, which interprets several
// characters specially. Those must be escaped in arguments, otherwise they could expand
// variables or inject commands (the "BatBadBut" class of vulnerabilities). `echo-shim.cmd`
// forwards its arguments to `echo.js`, so the subprocess prints back the exact
// `process.argv` it received: each argument must arrive unchanged and inert.
if (isWindows) {
	const testEscaping = async (t, commandArgument) => {
		const {stdout} = await execa('echo-shim.cmd', [commandArgument]);
		t.is(stdout, commandArgument);

		const {stdout: stdoutSync} = execaSync('echo-shim.cmd', [commandArgument]);
		t.is(stdoutSync, commandArgument);
	};

	// A `%VAR%` argument must be passed literally, not expanded by `cmd.exe`.
	test('Does not expand environment variables in arguments', testEscaping, '%PATH%');
	// Delayed expansion (`!VAR!`) must not be interpreted either.
	test('Does not expand delayed environment variables in arguments', testEscaping, '!PATH!');
	// An `&` must not be interpreted as a command separator.
	test('Does not allow command injection via `&` in arguments', testEscaping, 'a&b');
	// A `|` must not be interpreted as a pipe.
	test('Does not allow command injection via `|` in arguments', testEscaping, 'a|whoami');
	// Redirections (`<`, `>`) must not be interpreted.
	test('Does not allow command injection via redirections in arguments', testEscaping, 'a>b<c');
	// Parentheses must not be interpreted as command grouping.
	test('Does not allow command injection via parentheses in arguments', testEscaping, '(whoami)');
	// A quote followed by an injected command must stay inert.
	test('Does not allow command injection via nested quotes in arguments', testEscaping, '"& whoami &"');
	// Double quotes must be preserved.
	test('Preserves double quotes in arguments', testEscaping, 'a"b"c');
	// Carets are the escape character in `cmd.exe` and must be passed literally.
	test('Preserves carets in arguments', testEscaping, 'a^b^^c');
	// Backslashes, including trailing ones, must be preserved next to quotes.
	test('Preserves backslashes and double quotes in arguments', testEscaping, 'a\\"b\\\\"c\\');

	// Every kind of tricky argument must also roundtrip through `cmd.exe` unchanged, not
	// just be inert. Unlike `echo.js` (which resolves to `node.exe` and bypasses `cmd.exe`),
	// `echo-shim.cmd` forces the `cmd.exe` escaping path. This mirrors the roundtrip tests
	// above, but validates the `cmd.exe`-specific escaping rather than Node's native escaping.
	const testCmdRoundtrip = async (t, commandArguments) => {
		const expectedStdout = commandArguments.join('\n');

		const {stdout} = await execa('echo-shim.cmd', commandArguments);
		t.is(stdout, expectedStdout);

		const {stdout: stdoutSync} = execaSync('echo-shim.cmd', commandArguments);
		t.is(stdoutSync, expectedStdout);
	};

	// eslint-disable-next-line no-template-curly-in-string
	test('Roundtrips shell metacharacters through cmd.exe', testCmdRoundtrip, ['()', '[]', '%!', '^', '<', '>', '|', ';', ',', '=', '`', '*', '?', '$HOME', '${x}', '~']);
	test('Roundtrips backslashes and double quotes through cmd.exe', testCmdRoundtrip, ['a\\b', 'a\\\\b', 'a\\', 'a\\"b', '\\"', 'a"\\', '\\\\"', '"\\\\"']);
	// Long backslash runs must also roundtrip through the `cmd.exe` escaping specifically,
	// which is where the backslash-doubling actually runs. Kept modest to stay under the
	// `cmd.exe` command-line length limit once the backslashes are doubled.
	test('Roundtrips long backslash runs before quotes through cmd.exe', testCmdRoundtrip, [`${'\\'.repeat(200)}"`, '\\'.repeat(200), `a${'\\'.repeat(100)}"b`]);
	// The per-length sweep must roundtrip through `cmd.exe` too, since the corrupted doubling
	// is exactly what this escaping path performs.
	test('Roundtrips backslash runs of every length through cmd.exe', testCmdRoundtrip, backslashRunArguments);
	// Consecutive double quotes must survive the `cmd.exe` escaping, each escaped on its own.
	test('Roundtrips consecutive double quotes through cmd.exe', testCmdRoundtrip, ['""', '"""', 'a""b', '""""']);
	test('Roundtrips arguments with spaces through cmd.exe', testCmdRoundtrip, ['a b', ' '.repeat(3), 'foo bar baz', 'André Cruz']);

	/*
	`.bat` files re-expand their arguments through `cmd.exe` exactly like `.cmd` files, so they need the same double-escaping.
	`echo-shim.bat` is the `.bat` twin of `echo-shim.cmd`.
	*/
	const testBatEscaping = async (t, commandArgument) => {
		const {stdout} = await execa('echo-shim.bat', [commandArgument]);
		t.is(stdout, commandArgument);

		const {stdout: stdoutSync} = execaSync('echo-shim.bat', [commandArgument]);
		t.is(stdoutSync, commandArgument);
	};

	// The same nested-quote injection must stay inert when the batch file is a `.bat`.
	test('Does not allow command injection via nested quotes in `.bat` arguments', testBatEscaping, '"& whoami &"');
	// Metacharacters must survive the double `cmd.exe` expansion for `.bat` files too.
	test('Roundtrips shell metacharacters through a `.bat` file', testBatEscaping, '(foo|bar>baz|foz)');
	// A `.bat` file not in `node_modules/.bin/` must still be double-escaped, since the location is irrelevant: any batch file re-expands its arguments.
	test('Does not expand environment variables in `.bat` arguments', testBatEscaping, '%PATH%');
	// Backslashes, double quotes and metacharacters combined are the trickiest to escape, and must survive the double `cmd.exe` expansion of a `.bat` file intact.
	test('Preserves backslashes, quotes and metacharacters in `.bat` arguments', testBatEscaping, 'a\\"&b\\\\"|c\\');
	// Several tricky arguments passed together must each be double-escaped independently and arrive in order, not merged nor reordered.
	test('Roundtrips multiple tricky arguments through a `.bat` file', async t => {
		const commandArguments = ['a b', 'c&d', '"e"', 'f\\"g', '%h%'];
		const expectedStdout = commandArguments.join('\n');

		const {stdout} = await execa('echo-shim.bat', commandArguments);
		t.is(stdout, expectedStdout);

		const {stdout: stdoutSync} = execaSync('echo-shim.bat', commandArguments);
		t.is(stdoutSync, expectedStdout);
	});

	// `cmd.exe` interprets CR and LF as command separators and provides no way to escape
	// them, so those are rejected to prevent command injection.
	test('Rejects arguments containing a line break', t => {
		t.throws(() => execa('echo-shim.cmd', ['a\r\nb']), {instanceOf: TypeError, message: /line break/});
		t.throws(() => execaSync('echo-shim.cmd', ['a\r\nb']), {instanceOf: TypeError, message: /line break/});
	});

	// The command itself is validated too, not just its arguments.
	test('Rejects a command containing a line break', t => {
		t.throws(() => execa('echo\r\nshim.cmd', []), {instanceOf: TypeError, message: /line break/});
		t.throws(() => execaSync('echo\r\nshim.cmd', []), {instanceOf: TypeError, message: /line break/});
	});

	// A shell escapes the arguments itself, so the line break rejection does not apply.
	test('Does not reject line breaks when using a shell', async t => {
		await t.notThrowsAsync(execa('echo-shim.cmd', ['a\r\nb'], {shell: true, reject: false}));
		t.notThrows(() => execaSync('echo-shim.cmd', ['a\r\nb'], {shell: true, reject: false}));
	});
}
