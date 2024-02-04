import {delimiter, resolve} from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';
import pathKey from 'path-key';

export const PATH_KEY = pathKey();
export const FIXTURES_DIR_URL = new URL('../fixtures/', import.meta.url);
export const FIXTURES_DIR = resolve(fileURLToPath(FIXTURES_DIR_URL));

// Add the fixtures directory to PATH so fixtures can be executed without adding
// `node`. This is only meant to make writing tests simpler.
export const setFixtureDir = () => {
	process.env[PATH_KEY] = FIXTURES_DIR + delimiter + process.env[PATH_KEY];
};

