import test from 'ava';
import {execa, execaSync, $} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {getScriptSync, identity} from '../helpers/stdio.js';

setFixtureDir();

const textEncoder = new TextEncoder();
const binaryFoobar = textEncoder.encode('foobar');

const testInput = async (t, input, execaMethod) => {
	const {stdout} = await execaMethod('stdin.js', {input});
	t.is(stdout, 'foobar');
};

test('input option can be a String', testInput, 'foobar', execa);
test('input option can be a String - sync', testInput, 'foobar', execaSync);
test('input option can be a Uint8Array', testInput, binaryFoobar, execa);
test('input option can be a Uint8Array - sync', testInput, binaryFoobar, execaSync);

const testInputScript = async (t, getExecaMethod) => {
	const {stdout} = await getExecaMethod($({input: 'foobar'}))`stdin.js`;
	t.is(stdout, 'foobar');
};

test('input option can be used with $', testInputScript, identity);
test('input option can be used with $.sync', testInputScript, getScriptSync);
