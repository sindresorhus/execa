import {openSync, readSync, closeSync} from 'node:fs';
import {Buffer} from 'node:buffer';
import path from 'node:path';
import process from 'node:process';
import {whichCommandSync} from 'which-command';

/*
On Windows, `node:child_process` cannot natively run many kinds of files (`.cmd`, `.bat`, shebang scripts, ...): without a shell it resolves neither `PATHEXT` nor shebangs, and it does not escape arguments. We resolve the command to its full file path and escape its arguments ourselves, so those work without an explicit shell, just like on Unix, where the OS handles all of this for us.
*/
export const parseCommandFile = (file, commandArguments, options) => {
	// The arguments are cloned since a shebang interpreter might be prepended below, which must not mutate the caller's array
	const parsed = {file, commandArguments: [...commandArguments], options};

	// Under a shell, or on Unix, the OS resolves the file and escapes the arguments itself
	return options.shell || process.platform !== 'win32' ? parsed : escapeWindowsCommand(parsed);
};

// Only `.exe` and `.com` files can be spawned directly; anything else needs `cmd.exe`
const directlyExecutableRegExp = /\.(?:com|exe)$/i;

const escapeWindowsCommand = parsed => {
	// Resolve the file to an absolute path, following its shebang to the interpreter if any
	const resolvedFile = resolveWithShebang(parsed);

	// A directly executable file is spawned by its resolved path, bypassing `cmd.exe` and its escaping
	if (resolvedFile !== undefined && directlyExecutableRegExp.test(resolvedFile)) {
		if (parsed.options.argv0 === undefined) {
			parsed.options.argv0 = parsed.file;
		}

		parsed.file = resolvedFile;
		return parsed;
	}

	/*
	`cmd.exe` treats CR and LF as command separators and offers no way to escape them, so allowing either would enable command injection.
	Reject them instead.
	*/
	for (const value of [parsed.file, ...parsed.commandArguments]) {
		assertNoLineBreak(value);
	}

	/*
	POSIX separators must become Windows ones (`foo/bar` -> `foo\bar`), otherwise resolution always fails with ENOENT.

	Unlike Rust, which quotes the batch file's path, the file is caret-escaped. `cmd.exe` only interprets it once, and the file might not be resolved, for example when it is a `cmd.exe` builtin, which would not run if quoted.
	*/
	const escapedFile = escapeMetaChars(path.normalize(resolvedFile ?? parsed.file));
	const escapedArguments = parsed.commandArguments.map(argument => escapeArgument(argument));
	const commandLine = `"${[escapedFile, ...escapedArguments].join(' ')}"`;

	// Let `node:child_process` pass the already-escaped command line through untouched
	parsed.options.windowsVerbatimArguments = true;
	return {
		file: process.env.comspec || 'cmd.exe',
		// `/e:on` enables the command extensions the `%` escaping relies on, and `/v:off` disables delayed expansion so `!` is literal, even when the registry changes either default
		commandArguments: ['/d', '/e:on', '/v:off', '/s', '/c', commandLine],
		options: parsed.options,
	};
};

// Resolve the command's absolute path, then, if it is a shebang script, resolve its interpreter instead, since Windows cannot run shebangs natively
const resolveWithShebang = parsed => {
	const resolvedFile = resolvePath(parsed);
	const interpreter = resolvedFile !== undefined && readShebang(resolvedFile);
	if (!interpreter) {
		return resolvedFile;
	}

	// Run the interpreter with the script as its first argument, then resolve the interpreter's own path
	parsed.commandArguments.unshift(resolvedFile);
	parsed.file = interpreter;
	return resolvePath(parsed);
};

// Search `PATH` for the command, resolving its Windows executable extension via `PATHEXT`
const resolvePath = parsed => {
	const environment = parsed.options.env || process.env;
	const cwd = parsed.options.cwd ?? process.cwd();
	const environmentPathExt = getWindowsEnvironmentValue(environment, 'PATHEXT');
	const commandExtension = path.extname(parsed.file);
	// Commands with an explicit extension must be tried verbatim so shebang scripts work even when their extension is excluded from PATHEXT.
	const pathExt = commandExtension === '' ? environmentPathExt : `${commandExtension}${path.delimiter}${environmentPathExt ?? ''}`;
	if (hasWindowsPathSeparator(parsed.file)) {
		return whichCommandSync(path.resolve(cwd, parsed.file), {cwd, pathExt});
	}

	const searchPath = getWindowsEnvironmentValue(environment, 'PATH') ?? getWindowsEnvironmentValue(process.env, 'PATH') ?? '';
	const resolveOptions = {
		cwd,
		path: searchPath,
		pathExt,
	};

	return shouldSearchCurrentDirectory(environment) ? whichCommandSync(parsed.file, resolveOptions) : resolvePathDirectories(parsed.file, resolveOptions);
};

const hasWindowsPathSeparator = file => file.includes('/') || file.includes('\\') || file.includes(':');

const shouldSearchCurrentDirectory = environment => getWindowsEnvironmentValue(process.env, 'NODEFAULTCURRENTDIRECTORYINEXEPATH') === undefined && getWindowsEnvironmentValue(environment, 'NODEFAULTCURRENTDIRECTORYINEXEPATH') === undefined;

const resolvePathDirectories = (file, {cwd, path: searchPath, pathExt}) => {
	for (const directory of searchPath.split(path.delimiter)) {
		const unquotedDirectory = directory.length > 1 && directory.startsWith('"') && directory.endsWith('"') ? directory.slice(1, -1) : directory;
		if (unquotedDirectory === '') {
			continue;
		}

		const resolvedFile = whichCommandSync(path.resolve(cwd, unquotedDirectory, file), {cwd, pathExt});
		if (resolvedFile !== undefined) {
			return resolvedFile;
		}
	}
};

// Node sorts Windows environment keys and uses the first case-insensitive match when spawning.
const getWindowsEnvironmentValue = (environment, name) => {
	const environmentKey = Object.keys(environment).sort().find(key => key.toUpperCase() === name);
	return environmentKey === undefined ? undefined : environment[environmentKey];
};

const SHEBANG_BYTE_LENGTH = 150;

// Read the file's first bytes to find its shebang interpreter, if it has one
const readShebang = file => {
	const buffer = Buffer.alloc(SHEBANG_BYTE_LENGTH);
	let bytesRead = 0;

	try {
		const fileDescriptor = openSync(file, 'r');
		try {
			bytesRead = readSync(fileDescriptor, buffer, 0, SHEBANG_BYTE_LENGTH, 0);
		} finally {
			closeSync(fileDescriptor);
		}
	} catch {
		return undefined;
	}

	// A file shorter than the buffer leaves it zero-filled, so only the bytes actually read must be parsed.
	// Otherwise, a shebang line which is not terminated by a newline would include those `\0` characters.
	return parseShebang(buffer.toString('utf8', 0, bytesRead));
};

const shebangRegExp = /^#!(?<line>.*)/;

/*
Extract the interpreter from a shebang line, e.g. `#!/usr/bin/env node` -> `node`.
*/
const parseShebang = contents => {
	const shebangLine = contents.match(shebangRegExp)?.groups.line.trim();
	if (!shebangLine) {
		return undefined;
	}

	const [interpreterPath, argument] = shebangLine.split(' ', 2);
	const interpreter = interpreterPath.split('/').at(-1);
	if (interpreter === 'env') {
		return argument;
	}

	return argument ? `${interpreter} ${argument}` : interpreter;
};

const lineBreakRegExp = /[\n\r]/;

const assertNoLineBreak = value => {
	if (lineBreakRegExp.test(value)) {
		throw new TypeError(`The command and its arguments cannot contain a line break on Windows without a shell.\nThis would allow a command injection with \`cmd.exe\`.\nInvalid value: ${JSON.stringify(`${value}`)}`);
	}
};

// See https://web.archive.org/web/20241220221102/https://www.robvanderwoude.com/escapechars.php
// eslint-disable-next-line regexp/sort-character-class-elements
const metaCharsRegExp = /[()\][%!^"`<>&|;, *?]/g;

// Prefix every `cmd.exe` metacharacter with a caret to neutralize it. This is only used for the file, since arguments are quoted instead.
const escapeMetaChars = value => value.replaceAll(metaCharsRegExp, '^$&');

const backslashRunRegExp = /\\+/g;

// Matches any character requiring quoting: anything except ASCII letters, digits, a few punctuation characters that `cmd.exe` never interprets, and non-ASCII characters other than control characters
const quotedCharacterRegExp = /[^\w#$*+\-./:?@\\\u{80}-\u{10FFFF}]|\p{Control}/u;

/*
Escape an argument the same way as Rust's `std::process::Command` does for batch files, which fixed the "BatBadBut" vulnerability (CVE-2024-24576): https://github.com/rust-lang/rust/blob/main/library/std/src/sys/args/windows.rs (`append_bat_arg()`). yt-dlp uses the same algorithm.

Any argument containing a `cmd.exe` metacharacter is wrapped in double quotes, which keeps `cmd.exe` from interpreting it. `cmd.exe` might interpret it more than once: when invoking a batch file, then again when that batch file forwards it with `%*`, like npm cmd-shims do. Caret escaping depends on that count, so it breaks batch files reading their arguments directly with `%~1`, like Maven's `mvn.cmd`. Quoting does not, as long as the quotes stay balanced.

Rust only uses this for batch files. We use it for any file run through `cmd.exe`, since it is also correct when `cmd.exe` interprets the argument only once.

Limitations, which no escaping can fix since they depend on how the batch file uses its arguments:
- A batch file reading `%~1` gets the escaped argument without its surrounding quotes: double quotes are doubled, and trailing backslashes too.
- A batch file using `%~1` outside double quotes, or `%1` inside double quotes (like `if "%1" == ""`), lets `cmd.exe` interpret its metacharacters. Since `%1` includes the argument's surrounding quotes, the extra ones unquote it.
- A batch file forwarding its arguments with `call` expands `%` again, and one enabling delayed expansion expands `!` again.
*/
const escapeArgument = rawArgument => {
	/*
	Escape backslashes, following the algorithm at https://web.archive.org/web/20240930203505/https://qntm.org/cmd.

	A run of backslashes only needs doubling when it precedes a double quote, or the end of the argument since that becomes a double quote once the argument is wrapped below. Otherwise the backslashes would be taken as escaping that quote. Every double quote is then escaped in turn.

	Each backslash run is matched exactly once and consumed, so a long run cannot trigger the quadratic backtracking a naive pattern would, which would be a denial-of-service risk.

	Double quotes are escaped as `""` instead of `\"`. Both are a literal double quote inside a quoted argument for the subprocess, but only `""` keeps the quotes balanced for `cmd.exe`, which does not know about backslashes. Otherwise, the metacharacters after the double quote would not be quoted anymore, allowing command injection.

	`%` cannot be escaped inside double quotes, so it is replaced by `%%cd:~,%` instead. That is a literal `%` followed by an empty substring of the `%cd%` variable, which `cmd.exe` expands to nothing. This prevents `%VAR%` from being expanded.
	*/
	const argument = `${rawArgument}`;
	if (!shouldQuoteArgument(argument)) {
		return argument;
	}

	const escapedArgument = argument
		.replaceAll(backslashRunRegExp, (backslashes, offset, string) => {
			const nextCharacter = string[offset + backslashes.length];
			const isPrecedesDoubleQuote = nextCharacter === '"' || nextCharacter === undefined;
			return isPrecedesDoubleQuote ? backslashes.repeat(2) : backslashes;
		})
		.replaceAll('"', '""')
		.replaceAll('%', '%%cd:~,%');

	return `"${escapedArgument}"`;
};

/*
An empty argument must be quoted, otherwise it would be dropped.
An argument ending with a backslash must be quoted, otherwise a batch file wrapping it in double quotes, like `"%~1"`, would have that backslash escape its closing double quote.
Since `"` and `%` require quoting, an unquoted argument never needs any escaping.
*/
const shouldQuoteArgument = argument => argument === ''
	|| argument.endsWith('\\')
	|| quotedCharacterRegExp.test(argument);
