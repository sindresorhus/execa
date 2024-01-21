// When the `std*: Iterable | WebStream | URL | filePath`, `input` or `inputFile` option is used, we pipe to `childProcess.std*`.
// When the `std*: Array` option is used, we emulate some of the native values ('inherit', Node.js stream and file descriptor integer). To do so, we also need to pipe to `childProcess.std*`.
// Therefore the `std*` options must be either `pipe` or `overlapped`. Other values do not set `childProcess.std*`.
export const updateStdio = stdioStreamsGroups => stdioStreamsGroups.map(stdioStreams => updateStdioItem(stdioStreams));

// Whether `childProcess.std*` will be set
export const willPipeStreams = stdioStreams => PIPED_STDIO_VALUES.has(updateStdioItem(stdioStreams));

const PIPED_STDIO_VALUES = new Set(['pipe', 'overlapped', undefined, null]);

const updateStdioItem = stdioStreams => {
	if (stdioStreams.length > 1) {
		return stdioStreams.some(({value}) => value === 'overlapped') ? 'overlapped' : 'pipe';
	}

	const [stdioStream] = stdioStreams;
	return stdioStream.type !== 'native' && stdioStream.value !== 'overlapped' ? 'pipe' : stdioStream.value;
};
