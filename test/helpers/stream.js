import {Readable, Writable, Duplex} from 'node:stream';
import {foobarString} from './input.js';

export const noopReadable = () => new Readable({read() {}});
export const noopWritable = () => new Writable({write() {}});
export const noopDuplex = () => new Duplex({read() {}, write() {}});
export const simpleReadable = () => Readable.from([foobarString]);
