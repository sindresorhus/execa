import {Readable, Writable, Duplex} from 'node:stream';

// Convert the subprocess to web streams, mirroring `subprocess.readable()`, `subprocess.writable()` and `subprocess.duplex()`
export const createReadableStream = (subprocess, readableOptions) => Readable.toWeb(subprocess.readable(readableOptions));

export const createWritableStream = (subprocess, writableOptions) => Writable.toWeb(subprocess.writable(writableOptions));

export const createTransformStream = (subprocess, duplexOptions) => Duplex.toWeb(subprocess.duplex(duplexOptions));
