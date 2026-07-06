import {Readable, Writable, Duplex} from 'node:stream';

// Web stream versions of `subprocess.readable()`, `subprocess.writable()` and `subprocess.duplex()`.
// They wrap those methods with `.toWeb()`, so all error and abort handling is reused as is.
export const createReadableStream = (subprocess, readableOptions) => Readable.toWeb(subprocess.readable(readableOptions));
export const createWritableStream = (subprocess, writableOptions) => Writable.toWeb(subprocess.writable(writableOptions));
export const createTransformStream = (subprocess, duplexOptions) => Duplex.toWeb(subprocess.duplex(duplexOptions));
