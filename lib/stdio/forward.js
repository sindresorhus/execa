// When the `std*: Iterable | WebStream | URL | filePath`, `input` or `inputFile` option is used, we pipe to `subprocess.std*`.
// When the `std*: Array` option is used, we emulate some of the native values ('inherit', Node.js stream and file descriptor integer). To do so, we also need to pipe to `subprocess.std*`.
// Therefore the `std*` options must be either `pipe` or `overlapped`. Other values do not set `subprocess.std*`.
export const forwardStdio = stdioStreamsGroups => stdioStreamsGroups.map(stdioStreams => forwardStdioItem(stdioStreams));

// Whether `subprocess.std*` will be set
export const willPipeStreams = stdioStreams => PIPED_STDIO_VALUES.has(forwardStdioItem(stdioStreams));

export const PIPED_STDIO_VALUES = new Set(['pipe', 'overlapped', undefined, null]);

const forwardStdioItem = stdioStreams => {
	if (stdioStreams.length > 1) {
		return stdioStreams.some(({value}) => value === 'overlapped') ? 'overlapped' : 'pipe';
	}

	const [stdioStream] = stdioStreams;
	return stdioStream.type !== 'native' && stdioStream.value !== 'overlapped' ? 'pipe' : stdioStream.value;
};
