// Validate `encoding` option
export const validateEncoding = ({encoding}) => {
	if (ENCODINGS.has(encoding)) {
		return;
	}

	const correctEncoding = getCorrectEncoding(encoding);
	if (correctEncoding !== undefined) {
		throw new TypeError(`Invalid option \`encoding: ${serializeEncoding(encoding)}\`.
Please rename it to ${serializeEncoding(correctEncoding)}.`);
	}

	const correctEncodings = [...ENCODINGS].map(correctEncoding => serializeEncoding(correctEncoding)).join(', ');
	throw new TypeError(`Invalid option \`encoding: ${serializeEncoding(encoding)}\`.
Please rename it to one of: ${correctEncodings}.`);
};

const TEXT_ENCODINGS = new Set(['utf8', 'utf16le']);
export const BINARY_ENCODINGS = new Set(['buffer', 'hex', 'base64', 'base64url', 'latin1', 'ascii']);
const ENCODINGS = TEXT_ENCODINGS.union(BINARY_ENCODINGS);

/*
Encoding to use when converting a transform's string to bytes.
Text encodings describe how text is represented as bytes, so those must be used, otherwise the string would be decoded with a different encoding than the one it was encoded with, which corrupts it.
Binary encodings instead describe how bytes are serialized as text, so the string's UTF-8 bytes are used. The same applies with the `binary` transform option, since the transform then deals with raw bytes.
*/
export const getStringEncoding = (binary, encoding) => binary || !TEXT_ENCODINGS.has(encoding) ? 'utf8' : encoding;

// Text encodings only apply to the subprocess' output. Its input is always text encoded with UTF-8, so input transforms decode and encode strings with UTF-8 too, whichever text encoding the `encoding` option uses.
export const getInputEncoding = encoding => TEXT_ENCODINGS.has(encoding) ? 'utf8' : encoding;

const getCorrectEncoding = encoding => {
	if (encoding === null) {
		return 'buffer';
	}

	if (typeof encoding !== 'string') {
		return;
	}

	const lowerEncoding = encoding.toLowerCase();
	if (lowerEncoding in ENCODING_ALIASES) {
		return ENCODING_ALIASES[lowerEncoding];
	}

	if (ENCODINGS.has(lowerEncoding)) {
		return lowerEncoding;
	}
};

const ENCODING_ALIASES = {
	__proto__: null,
	// eslint-disable-next-line unicorn/text-encoding-identifier-case
	'utf-8': 'utf8',
	'utf-16le': 'utf16le',
	'ucs-2': 'utf16le',
	ucs2: 'utf16le',
	binary: 'latin1',
};

const serializeEncoding = encoding => typeof encoding === 'string' ? `"${encoding}"` : String(encoding);
