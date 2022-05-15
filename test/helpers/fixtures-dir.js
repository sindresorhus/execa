import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';
import pathKey from 'path-key';

const PATH_KEY = pathKey();
const FIXTURES_DIR = fileURLToPath(new URL('../fixtures', import.meta.url));

// Add the fixtures directory to PATH so fixtures can be executed without adding
// `node`. This is only meant to make writing tests simpler.
export const setFixtureDir = () => {
	process.env[PATH_KEY] = FIXTURES_DIR + path.delimiter + process.env[PATH_KEY];
};

