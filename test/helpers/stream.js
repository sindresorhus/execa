import {Readable, Writable, PassThrough, getDefaultHighWaterMark} from 'node:stream';
import {foobarString} from './input.js';

export const noopReadable = () => new Readable({read() {}});
export const noopWritable = () => new Writable({write() {}});
export const noopDuplex = () => new PassThrough().resume();
export const simpleReadable = () => Readable.from([foobarString]);

export const defaultHighWaterMark = getDefaultHighWaterMark(false);
export const defaultObjectHighWaterMark = getDefaultHighWaterMark(true);
