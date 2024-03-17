// Whether `subprocess.std*` will be set
export const willPipeFileDescriptor = stdioItems => PIPED_STDIO_VALUES.has(forwardStdio(stdioItems));

export const PIPED_STDIO_VALUES = new Set(['pipe', 'overlapped', undefined, null]);

// When the `std*: Iterable | WebStream | URL | filePath`, `input` or `inputFile` option is used, we pipe to `subprocess.std*`.
// When the `std*: Array` option is used, we emulate some of the native values ('inherit', Node.js stream and file descriptor integer). To do so, we also need to pipe to `subprocess.std*`.
// Therefore the `std*` options must be either `pipe` or `overlapped`. Other values do not set `subprocess.std*`.
export const forwardStdio = stdioItems => {
	if (stdioItems.length > 1) {
		return stdioItems.some(({value}) => value === 'overlapped') ? 'overlapped' : 'pipe';
	}

	const [{type, value}] = stdioItems;
	return type === 'native' ? value : 'pipe';
};
