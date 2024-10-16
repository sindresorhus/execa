import {spawn} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import test from 'ava';
import {$, execa} from '../../index.js';
import {setFixtureDirectory, FIXTURES_DIRECTORY} from '../helpers/fixtures-directory.js';
import {foobarString} from '../helpers/input.js';
import {getDenoNodePath} from '../helpers/file-path.js';

setFixtureDirectory();

test('$.pipe(subprocess)', async t => {
	const {stdout} = await $`noop.js ${foobarString}`.pipe($({stdin: 'pipe'})`stdin.js`);
	t.is(stdout, foobarString);
});

test('execa.$.pipe(subprocess)', async t => {
	const {stdout} = await execa('noop.js', [foobarString]).pipe($({stdin: 'pipe'})`stdin.js`);
	t.is(stdout, foobarString);
});

test('$.pipe.pipe(subprocess)', async t => {
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

test('$.pipe("file")', async t => {
	const {stdout} = await $`noop.js ${foobarString}`.pipe('stdin.js');
	t.is(stdout, foobarString);
});

test('execa.$.pipe("file")`', async t => {
	const {stdout} = await execa('noop.js', [foobarString]).pipe('stdin.js');
	t.is(stdout, foobarString);
});

test('$.pipe.pipe("file")', async t => {
	const {stdout} = await $`noop.js ${foobarString}`
		.pipe`stdin.js`
		.pipe('stdin.js');
	t.is(stdout, foobarString);
});

test('execa.$.pipe(fileUrl)`', async t => {
	const {stdout} = await execa('noop.js', [foobarString]).pipe(pathToFileURL(`${FIXTURES_DIRECTORY}/stdin.js`));
	t.is(stdout, foobarString);
});

test('$.pipe("file", commandArguments, options)', async t => {
	const {stdout} = await $`noop.js ${foobarString}`.pipe('node', ['stdin.js'], {cwd: FIXTURES_DIRECTORY});
	t.is(stdout, foobarString);
});

test('execa.$.pipe("file", commandArguments, options)`', async t => {
	const {stdout} = await execa('noop.js', [foobarString]).pipe('node', ['stdin.js'], {cwd: FIXTURES_DIRECTORY});
	t.is(stdout, foobarString);
});

test('execa.$.pipe("file", commandArguments, options with denoNodePath)`', async t => {
	const {stdout} = await execa('noop.js', [foobarString]).pipe('node', ['stdin.js'], {cwd: FIXTURES_DIRECTORY, nodePath: getDenoNodePath()});
	t.is(stdout, foobarString);
});

test('execa.$.pipe("file", commandArguments, denoNodePath)`', async t => {
	const {stdout} = await execa('noop.js', [foobarString]).pipe(getDenoNodePath(), ['stdin.js'], {cwd: FIXTURES_DIRECTORY});
	t.is(stdout, foobarString);
});

test('$.pipe.pipe("file", commandArguments, options)', async t => {
	const {stdout} = await $`noop.js ${foobarString}`
		.pipe`stdin.js`
		.pipe('node', ['stdin.js'], {cwd: FIXTURES_DIRECTORY});
	t.is(stdout, foobarString);
});

test('$.pipe(subprocess, pipeOptions)', async t => {
	const {stdout} = await $`noop-fd.js 2 ${foobarString}`.pipe($({stdin: 'pipe'})`stdin.js`, {from: 'stderr'});
	t.is(stdout, foobarString);
});

test('execa.$.pipe(subprocess, pipeOptions)', async t => {
	const {stdout} = await execa('noop-fd.js', ['2', foobarString]).pipe($({stdin: 'pipe'})`stdin.js`, {from: 'stderr'});
	t.is(stdout, foobarString);
});

test('$.pipe.pipe(subprocess, pipeOptions)', async t => {
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

test('$.pipe("file", pipeOptions)', async t => {
	const {stdout} = await $`noop-fd.js 2 ${foobarString}`.pipe('stdin.js', {from: 'stderr'});
	t.is(stdout, foobarString);
});

test('execa.$.pipe("file", pipeOptions)', async t => {
	const {stdout} = await execa('noop-fd.js', ['2', foobarString]).pipe('stdin.js', {from: 'stderr'});
	t.is(stdout, foobarString);
});

test('$.pipe.pipe("file", pipeOptions)', async t => {
	const {stdout} = await $`noop-fd.js 2 ${foobarString}`
		.pipe({from: 'stderr'})`noop-stdin-fd.js 2`
		.pipe('stdin.js', {from: 'stderr'});
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

test('$.pipe("file", options)', async t => {
	const {stdout} = await $`noop.js ${foobarString}`.pipe('stdin.js', {stripFinalNewline: false});
	t.is(stdout, `${foobarString}\n`);
});

test('execa.$.pipe("file", options)', async t => {
	const {stdout} = await execa('noop.js', [foobarString]).pipe('stdin.js', {stripFinalNewline: false});
	t.is(stdout, `${foobarString}\n`);
});

test('$.pipe.pipe("file", options)', async t => {
	const {stdout} = await $`noop.js ${foobarString}`
		.pipe({})`stdin.js`
		.pipe('stdin.js', {stripFinalNewline: false});
	t.is(stdout, `${foobarString}\n`);
});

test('$.pipe(pipeAndSubprocessOptions)`command`', async t => {
	const {stdout} = await $`noop-fd.js 2 ${foobarString}\n`.pipe({from: 'stderr', stripFinalNewline: false})`stdin.js`;
	t.is(stdout, `${foobarString}\n`);
});

test('execa.$.pipe(pipeAndSubprocessOptions)`command`', async t => {
	const {stdout} = await execa('noop-fd.js', ['2', `${foobarString}\n`]).pipe({from: 'stderr', stripFinalNewline: false})`stdin.js`;
	t.is(stdout, `${foobarString}\n`);
});

test('$.pipe.pipe(pipeAndSubprocessOptions)`command`', async t => {
	const {stdout} = await $`noop-fd.js 2 ${foobarString}\n`
		.pipe({from: 'stderr'})`noop-stdin-fd.js 2`
		.pipe({from: 'stderr', stripFinalNewline: false})`stdin.js`;
	t.is(stdout, `${foobarString}\n`);
});

test('$.pipe("file", pipeAndSubprocessOptions)', async t => {
	const {stdout} = await $`noop-fd.js 2 ${foobarString}\n`.pipe('stdin.js', {from: 'stderr', stripFinalNewline: false});
	t.is(stdout, `${foobarString}\n`);
});

test('execa.$.pipe("file", pipeAndSubprocessOptions)', async t => {
	const {stdout} = await execa('noop-fd.js', ['2', `${foobarString}\n`]).pipe('stdin.js', {from: 'stderr', stripFinalNewline: false});
	t.is(stdout, `${foobarString}\n`);
});

test('$.pipe.pipe("file", pipeAndSubprocessOptions)', async t => {
	const {stdout} = await $`noop-fd.js 2 ${foobarString}\n`
		.pipe({from: 'stderr'})`noop-stdin-fd.js 2`
		.pipe('stdin.js', {from: 'stderr', stripFinalNewline: false});
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

test('$.pipe`command` forces "stdin: pipe"', async t => {
	const {stdout} = await $`noop.js ${foobarString}`.pipe({stdin: 'ignore'})`stdin.js`;
	t.is(stdout, foobarString);
});

test('execa.pipe("file") forces "stdin: "pipe"', async t => {
	const {stdout} = await execa('noop.js', [foobarString]).pipe('stdin.js', {stdin: 'ignore'});
	t.is(stdout, foobarString);
});

test('execa.pipe(subprocess) does not force "stdin: pipe"', async t => {
	await t.throwsAsync(
		execa('noop.js', [foobarString]).pipe(execa('stdin.js', {stdin: 'ignore'})),
		{message: /"stdin: 'ignore'" option is incompatible/},
	);
});

test('$.pipe(options)(subprocess) fails', async t => {
	await t.throwsAsync(
		$`empty.js`.pipe({stdout: 'pipe'})($`empty.js`),
		{message: /Please use \.pipe/},
	);
});

test('execa.$.pipe(options)(subprocess) fails', async t => {
	await t.throwsAsync(
		execa('empty.js').pipe({stdout: 'pipe'})($`empty.js`),
		{message: /Please use \.pipe/},
	);
});

test('$.pipe(options)("file") fails', async t => {
	await t.throwsAsync(
		$`empty.js`.pipe({stdout: 'pipe'})('empty.js'),
		{message: /Please use \.pipe/},
	);
});

test('execa.$.pipe(options)("file") fails', async t => {
	await t.throwsAsync(
		execa('empty.js').pipe({stdout: 'pipe'})('empty.js'),
		{message: /Please use \.pipe/},
	);
});

const testInvalidPipe = async (t, ...pipeArguments) => {
	await t.throwsAsync(
		$`empty.js`.pipe(...pipeArguments),
		{message: /must be a template string/},
	);
};

test('$.pipe(nonExecaSubprocess) fails', testInvalidPipe, spawn('node', ['--version']));
test('$.pipe(false) fails', testInvalidPipe, false);
