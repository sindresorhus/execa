import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';
import pathKey from 'path-key';

export const PATH_KEY = pathKey();
export const FIXTURES_DIRECTORY_URL = new URL('../fixtures/', import.meta.url);
// @todo: use import.meta.dirname after dropping support for Node <20.11.0
export const FIXTURES_DIRECTORY = path.resolve(fileURLToPath(FIXTURES_DIRECTORY_URL));

// Add the fixtures directory to PATH so fixtures can be executed without adding
// `node`. This is only meant to make writing tests simpler.
export const setFixtureDirectory = () => {
	process.env[PATH_KEY] = FIXTURES_DIRECTORY + path.delimiter + process.env[PATH_KEY];
};

