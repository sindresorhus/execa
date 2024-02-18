import {spawn} from 'node:child_process';
import test from 'ava';
import {$, execa} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {foobarString} from '../helpers/input.js';

setFixtureDir();

test('$.pipe(childProcess)', async t => {
	const {stdout} = await $`noop.js ${foobarString}`.pipe($({stdin: 'pipe'})`stdin.js`);
	t.is(stdout, foobarString);
});

test('execa.$.pipe(childProcess)', async t => {
	const {stdout} = await execa('noop.js', [foobarString]).pipe($({stdin: 'pipe'})`stdin.js`);
	t.is(stdout, foobarString);
});

test('$.pipe.pipe(childProcess)', async t => {
	const {stdout} = await $`noop.js ${foobarString}`
		.pipe($({stdin: 'pipe'})`stdin.js`)
		.pipe($({stdin: 'pipe'})`stdin.js`);
	t.is(stdout, foobarString);
});

test('$.pipe`command`', async t => {
	const {stdout} = await $`noop.js ${foobarString}`.pipe`stdin.js`;
	t.is(stdout, foobarString);
});

test('execa.$.pipe`command`', async t => {
	const {stdout} = await execa('noop.js', [foobarString]).pipe`stdin.js`;
	t.is(stdout, foobarString);
});

test('$.pipe.pipe`command`', async t => {
	const {stdout} = await $`noop.js ${foobarString}`
		.pipe`stdin.js`
		.pipe`stdin.js`;
	t.is(stdout, foobarString);
});

test('$.pipe(childProcess, pipeOptions)', async t => {
	const {stdout} = await $`noop-fd.js 2 ${foobarString}`.pipe($({stdin: 'pipe'})`stdin.js`, {from: 'stderr'});
	t.is(stdout, foobarString);
});

test('execa.$.pipe(childProcess, pipeOptions)', async t => {
	const {stdout} = await execa('noop-fd.js', ['2', foobarString]).pipe($({stdin: 'pipe'})`stdin.js`, {from: 'stderr'});
	t.is(stdout, foobarString);
});

test('$.pipe.pipe(childProcess, pipeOptions)', async t => {
	const {stdout} = await $`noop-fd.js 2 ${foobarString}`
		.pipe($({stdin: 'pipe'})`noop-stdin-fd.js 2`, {from: 'stderr'})
		.pipe($({stdin: 'pipe'})`stdin.js`, {from: 'stderr'});
	t.is(stdout, foobarString);
});

test('$.pipe(pipeOptions)`command`', async t => {
	const {stdout} = await $`noop-fd.js 2 ${foobarString}`.pipe({from: 'stderr'})`stdin.js`;
	t.is(stdout, foobarString);
});

test('execa.$.pipe(pipeOptions)`command`', async t => {
	const {stdout} = await execa('noop-fd.js', ['2', foobarString]).pipe({from: 'stderr'})`stdin.js`;
	t.is(stdout, foobarString);
});

test('$.pipe.pipe(pipeOptions)`command`', async t => {
	const {stdout} = await $`noop-fd.js 2 ${foobarString}`
		.pipe({from: 'stderr'})`noop-stdin-fd.js 2`
		.pipe({from: 'stderr'})`stdin.js`;
	t.is(stdout, foobarString);
});

test('$.pipe(options)`command`', async t => {
	const {stdout} = await $`noop.js ${foobarString}`.pipe({stripFinalNewline: false})`stdin.js`;
	t.is(stdout, `${foobarString}\n`);
});

test('execa.$.pipe(options)`command`', async t => {
	const {stdout} = await execa('noop.js', [foobarString]).pipe({stripFinalNewline: false})`stdin.js`;
	t.is(stdout, `${foobarString}\n`);
});

test('$.pipe.pipe(options)`command`', async t => {
	const {stdout} = await $`noop.js ${foobarString}`
		.pipe({})`stdin.js`
		.pipe({stripFinalNewline: false})`stdin.js`;
	t.is(stdout, `${foobarString}\n`);
});

test('$.pipe(pipeAndProcessOptions)`command`', async t => {
	const {stdout} = await $`noop-fd.js 2 ${foobarString}\n`.pipe({from: 'stderr', stripFinalNewline: false})`stdin.js`;
	t.is(stdout, `${foobarString}\n`);
});

test('execa.$.pipe(pipeAndProcessOptions)`command`', async t => {
	const {stdout} = await execa('noop-fd.js', ['2', `${foobarString}\n`]).pipe({from: 'stderr', stripFinalNewline: false})`stdin.js`;
	t.is(stdout, `${foobarString}\n`);
});

test('$.pipe.pipe(pipeAndProcessOptions)`command`', async t => {
	const {stdout} = await $`noop-fd.js 2 ${foobarString}\n`
		.pipe({from: 'stderr'})`noop-stdin-fd.js 2`
		.pipe({from: 'stderr', stripFinalNewline: false})`stdin.js`;
	t.is(stdout, `${foobarString}\n`);
});

test('$.pipe(options)(secondOptions)`command`', async t => {
	const {stdout} = await $`noop.js ${foobarString}`.pipe({stripFinalNewline: false})({stripFinalNewline: true})`stdin.js`;
	t.is(stdout, foobarString);
});

test('execa.$.pipe(options)(secondOptions)`command`', async t => {
	const {stdout} = await execa('noop.js', [foobarString]).pipe({stripFinalNewline: false})({stripFinalNewline: true})`stdin.js`;
	t.is(stdout, foobarString);
});

test('$.pipe.pipe(options)(secondOptions)`command`', async t => {
	const {stdout} = await $`noop.js ${foobarString}`
		.pipe({})({})`stdin.js`
		.pipe({stripFinalNewline: false})({stripFinalNewline: true})`stdin.js`;
	t.is(stdout, foobarString);
});

test('$.pipe(options)(childProcess) fails', async t => {
	await t.throwsAsync(
		$`empty.js`.pipe({stdout: 'pipe'})($`empty.js`),
		{message: /Please use \.pipe/},
	);
});

test('execa.$.pipe(options)(childProcess) fails', async t => {
	await t.throwsAsync(
		execa('empty.js').pipe({stdout: 'pipe'})($`empty.js`),
		{message: /Please use \.pipe/},
	);
});

const testInvalidPipe = async (t, ...args) => {
	await t.throwsAsync(
		$`empty.js`.pipe(...args),
		{message: /must be a template string/},
	);
};

test('$.pipe(nonExecaChildProcess) fails', testInvalidPipe, spawn('node', ['--version']));
test('$.pipe(false) fails', testInvalidPipe, false);
