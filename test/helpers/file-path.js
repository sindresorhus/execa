import path from 'node:path';
import process from 'node:process';

export const getAbsolutePath = file => ({file});
export const getRelativePath = filePath => ({file: path.relative('.', filePath)});
// Defined as getter so call to toString is not cached
export const getDenoNodePath = () => Object.freeze({
	__proto__: String.prototype,
	toString() {
		return process.execPath;
	},
	get length() {
		return this.toString().length;
	},
});
