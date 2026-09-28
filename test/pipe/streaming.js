import assert from 'node:assert/strict';
import {once} from 'node:events';
import {PassThrough} from 'node:stream';
import test from 'node:test';
import {assertRejects, assertLike} from '../helpers/assert.js';
import {execa} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString} from '../helpers/input.js';
import {assertMaxListeners} from '../helpers/listeners.js';
import {fullReadableStdio} from '../helpers/stdio.js';
import {PARALLEL_COUNT} from '../helpers/parallel.js';

setFixtureDirectory();

test('Can pipe two sources to same destination', async () => {
	const source = execa('noop.js', [foobarString]);
	const secondSource = execa('noop.js', [foobarString]);
	const destination = execa('stdin.js');
	const pipePromise = source.pipe(destination);
	const secondPipePromise = secondSource.pipe(destination);

	assertLike(await source, {stdout: foobarString});
	assertLike(await secondSource, {stdout: foobarString});
	assertLike(await destination, {stdout: `${foobarString}\n${foobarString}`});
	assert.equal(await pipePromise, await destination);
	assert.equal(await secondPipePromise, await destination);
});

test('Can pipe three sources to same destination', async () => {
	const source = execa('noop.js', [foobarString]);
	const secondSource = execa('noop.js', [foobarString]);
	const thirdSource = execa('noop.js', [foobarString]);
	const destination = execa('stdin.js');
	const pipePromise = source.pipe(destination);
	const secondPipePromise = secondSource.pipe(destination);
	const thirdPromise = thirdSource.pipe(destination);

	assertLike(await source, {stdout: foobarString});
	assertLike(await secondSource, {stdout: foobarString});
	assertLike(await thirdSource, {stdout: foobarString});
	assertLike(await destination, {stdout: `${foobarString}\n${foobarString}\n${foobarString}`});
	assert.equal(await pipePromise, await destination);
	assert.equal(await secondPipePromise, await destination);
	assert.equal(await thirdPromise, await destination);
});

test('Can pipe many sources to same destination', async () => {
	const checkMaxListeners = assertMaxListeners();

	const expectedResults = Array.from({length: PARALLEL_COUNT}, (_, index) => `${index}`).sort();
	const sources = expectedResults.map(expectedResult => execa('noop.js', [expectedResult]));
	const destination = execa('stdin.js');
	const pipePromises = sources.map(source => source.pipe(destination));

	const results = await Promise.all(sources);
	assert.deepEqual(results.map(({stdout}) => stdout), expectedResults);
	const destinationResult = await destination;
	assert.deepEqual(destinationResult.stdout.split('\n').sort(), expectedResults);
	assert.deepEqual(await Promise.all(pipePromises), sources.map(() => destinationResult));

	checkMaxListeners();
});

test('Can pipe same source to many destinations', async () => {
	const checkMaxListeners = assertMaxListeners();

	const source = execa('noop-fd.js', ['1', foobarString]);
	const expectedResults = Array.from({length: PARALLEL_COUNT}, (_, index) => `${index}`);
	const destinations = expectedResults.map(expectedResult => execa('noop-stdin-double.js', [expectedResult]));
	const pipePromises = destinations.map(destination => source.pipe(destination));

	assertLike(await source, {stdout: foobarString});
	const results = await Promise.all(destinations);
	assert.deepEqual(results.map(({stdout}) => stdout), expectedResults.map(result => `${foobarString} ${result}`));
	assert.deepEqual(await Promise.all(pipePromises), results);

	checkMaxListeners();
});

test('Can pipe two streams from same subprocess to same destination', async () => {
	const source = execa('noop-both.js', [foobarString]);
	const destination = execa('stdin.js');
	const pipePromise = source.pipe(destination);
	const secondPipePromise = source.pipe(destination, {from: 'stderr'});

	assertLike(await source, {stdout: foobarString, stderr: foobarString});
	assertLike(await destination, {stdout: `${foobarString}\n${foobarString}`});
	assert.equal(await pipePromise, await destination);
	assert.equal(await secondPipePromise, await destination);
});

test('Can pipe same source to two streams from same subprocess', async () => {
	const source = execa('noop-fd.js', ['1', foobarString]);
	const destination = execa('stdin-fd-both.js', ['3'], fullReadableStdio());
	const pipePromise = source.pipe(destination);
	const secondPipePromise = source.pipe(destination, {to: 'fd3'});

	assertLike(await source, {stdout: foobarString});
	assertLike(await destination, {stdout: `${foobarString}${foobarString}`});
	assert.equal(await pipePromise, await destination);
	assert.equal(await secondPipePromise, await destination);
});

test('Can pipe a new source to same destination after some source has already written', async () => {
	const passThroughStream = new PassThrough();
	const source = execa('stdin.js', {stdin: ['pipe', passThroughStream]});
	const destination = execa('stdin.js');
	const pipePromise = source.pipe(destination);

	passThroughStream.write('foo');
	const firstWrite = await once(destination.stdout, 'data');
	assert.equal(firstWrite.toString(), 'foo');

	const secondSource = execa('noop.js', ['bar']);
	const secondPipePromise = secondSource.pipe(destination);
	passThroughStream.end();

	assertLike(await source, {stdout: 'foo'});
	assertLike(await secondSource, {stdout: 'bar'});
	assertLike(await destination, {stdout: 'foobar'});
	assert.equal(await pipePromise, await destination);
	assert.equal(await secondPipePromise, await destination);
});

test('Can pipe a second source to same destination after destination has already ended', async () => {
	const source = execa('noop.js', [foobarString]);
	const destination = execa('stdin.js');
	const pipePromise = source.pipe(destination);

	assertLike(await source, {stdout: foobarString});
	assertLike(await destination, {stdout: foobarString});
	assert.equal(await pipePromise, await destination);

	const secondSource = execa('noop.js', [foobarString]);
	const secondPipePromise = secondSource.pipe(destination);

	assertLike(await secondSource, {stdout: ''});
	assert.equal(await secondPipePromise, await destination);
});

test('Can pipe same source to a second destination after source has already ended', async () => {
	const source = execa('noop.js', [foobarString]);
	const destination = execa('stdin.js');
	const pipePromise = source.pipe(destination);

	assertLike(await source, {stdout: foobarString});
	assertLike(await destination, {stdout: foobarString});
	assert.equal(await pipePromise, await destination);

	const secondDestination = execa('stdin.js');
	const secondPipePromise = source.pipe(secondDestination);

	assertLike(await secondDestination, {stdout: ''});
	assert.equal(await secondPipePromise, await secondDestination);
});

test('Can pipe a new source to same destination after some but not all sources have ended', async () => {
	const source = execa('noop.js', [foobarString]);
	const passThroughStream = new PassThrough();
	const secondSource = execa('stdin.js', {stdin: ['pipe', passThroughStream]});
	const destination = execa('stdin.js');
	const pipePromise = source.pipe(destination);
	const secondPipePromise = secondSource.pipe(destination);

	assertLike(await source, {stdout: foobarString});

	const thirdSource = execa('noop.js', [foobarString]);
	const thirdPipePromise = thirdSource.pipe(destination);
	passThroughStream.end(`${foobarString}\n`);

	assertLike(await secondSource, {stdout: foobarString});
	assertLike(await thirdSource, {stdout: foobarString});
	assertLike(await destination, {stdout: `${foobarString}\n${foobarString}\n${foobarString}`});
	assert.equal(await pipePromise, await destination);
	assert.equal(await secondPipePromise, await destination);
	assert.equal(await thirdPipePromise, await destination);
});

test('Can pipe two subprocesses already ended', async () => {
	const source = execa('noop.js', [foobarString]);
	const destination = execa('stdin.js');
	destination.stdin.end('.');
	await Promise.all([source, destination]);
	const pipePromise = source.pipe(destination);

	assertLike(await source, {stdout: foobarString});
	assertLike(await destination, {stdout: '.'});
	assert.equal(await pipePromise, await destination);
});

test('Can pipe to same destination through multiple paths', async () => {
	const source = execa('noop.js', [foobarString]);
	const destination = execa('stdin.js');
	const secondDestination = execa('stdin.js');
	const pipePromise = source.pipe(destination);
	const secondPipePromise = pipePromise.pipe(secondDestination);
	const thirdPipePromise = source.pipe(secondDestination);

	assertLike(await source, {stdout: foobarString});
	assertLike(await destination, {stdout: foobarString});
	assertLike(await secondDestination, {stdout: `${foobarString}\n${foobarString}`});
	assert.equal(await pipePromise, await destination);
	assert.equal(await secondPipePromise, await secondDestination);
	assert.equal(await thirdPipePromise, await secondDestination);
});

test('Can pipe two sources to same destination in objectMode', async () => {
	const stdoutTransform = {
		* transform() {
			yield [foobarString];
		},
		objectMode: true,
	};
	const source = execa('noop.js', [''], {stdout: stdoutTransform});
	const secondSource = execa('noop.js', [''], {stdout: stdoutTransform});
	assert.equal(source.stdout.readableObjectMode, true);
	assert.equal(secondSource.stdout.readableObjectMode, true);

	const stdinTransform = {
		* transform([chunk]) {
			yield chunk;
		},
		objectMode: true,
	};
	const destination = execa('stdin.js', {stdin: stdinTransform});
	const pipePromise = source.pipe(destination);
	const secondPipePromise = secondSource.pipe(destination);

	assertLike(await source, {stdout: [[foobarString]]});
	assertLike(await secondSource, {stdout: [[foobarString]]});
	assertLike(await destination, {stdout: `${foobarString}\n${foobarString}`});
	assert.equal(await pipePromise, await destination);
	assert.equal(await secondPipePromise, await destination);
});

test('Can pipe one source to two destinations', async () => {
	const source = execa('noop.js', [foobarString]);
	const destination = execa('stdin.js');
	const secondDestination = execa('stdin.js');
	const pipePromise = source.pipe(destination);
	const secondPipePromise = source.pipe(secondDestination);

	assertLike(await source, {stdout: foobarString});
	assertLike(await destination, {stdout: foobarString});
	assertLike(await secondDestination, {stdout: foobarString});
	assert.equal(await pipePromise, await destination);
	assert.equal(await secondPipePromise, await secondDestination);
});

test('Can pipe one source to three destinations', async () => {
	const source = execa('noop.js', [foobarString]);
	const destination = execa('stdin.js');
	const secondDestination = execa('stdin.js');
	const thirdDestination = execa('stdin.js');
	const pipePromise = source.pipe(destination);
	const secondPipePromise = source.pipe(secondDestination);
	const thirdPipePromise = source.pipe(thirdDestination);

	assertLike(await source, {stdout: foobarString});
	assertLike(await destination, {stdout: foobarString});
	assertLike(await secondDestination, {stdout: foobarString});
	assertLike(await thirdDestination, {stdout: foobarString});
	assert.equal(await pipePromise, await destination);
	assert.equal(await secondPipePromise, await secondDestination);
	assert.equal(await thirdPipePromise, await thirdDestination);
});

test('Can create a series of pipes', async () => {
	const source = execa('noop.js', [foobarString]);
	const destination = execa('stdin.js');
	const secondDestination = execa('stdin.js');
	const pipePromise = source.pipe(destination);
	const secondPipePromise = pipePromise.pipe(secondDestination);

	assertLike(await source, {stdout: foobarString});
	assertLike(await destination, {stdout: foobarString});
	assertLike(await secondDestination, {stdout: foobarString});
	assert.equal(await pipePromise, await destination);
	assert.equal(await secondPipePromise, await secondDestination);
});

test('Returns pipedFrom on success', async () => {
	const source = execa('noop.js', [foobarString]);
	const destination = execa('stdin.js');
	const pipePromise = source.pipe(destination);

	const destinationResult = await destination;
	assert.deepEqual(destinationResult.pipedFrom, []);
	const sourceResult = await source;

	assertLike(await pipePromise, {pipedFrom: [sourceResult]});
	assert.deepEqual(destinationResult.pipedFrom, [sourceResult]);
	assert.deepEqual(sourceResult.pipedFrom, []);
});

test('Returns pipedFrom on deep success', async () => {
	const source = execa('noop.js', [foobarString]);
	const destination = execa('stdin.js');
	const secondDestination = execa('stdin.js');
	const pipePromise = source.pipe(destination);
	const secondPipePromise = pipePromise.pipe(secondDestination);

	const destinationResult = await destination;
	assert.deepEqual(destinationResult.pipedFrom, []);
	const secondDestinationResult = await secondDestination;
	assert.deepEqual(secondDestinationResult.pipedFrom, []);
	const sourceResult = await source;

	assertLike(await secondPipePromise, {pipedFrom: [destinationResult]});
	assert.deepEqual(secondDestinationResult.pipedFrom, [destinationResult]);
	assertLike(await pipePromise, {pipedFrom: [sourceResult]});
	assert.deepEqual(destinationResult.pipedFrom, [sourceResult]);
	assert.deepEqual(sourceResult.pipedFrom, []);
});

test('Returns pipedFrom on source failure', async () => {
	const source = execa('noop-fail.js', ['1', foobarString]);
	const destination = execa('stdin.js');
	const pipePromise = source.pipe(destination);

	const destinationResult = await destination;
	assert.deepEqual(destinationResult.pipedFrom, []);
	const sourceResult = await assertRejects(source);

	assertLike(await assertRejects(pipePromise), {pipedFrom: []});
	assert.deepEqual(destinationResult.pipedFrom, [sourceResult]);
	assert.deepEqual(sourceResult.pipedFrom, []);
});

test('Returns pipedFrom on destination failure', async () => {
	const source = execa('noop.js', [foobarString]);
	const destination = execa('stdin-fail.js');
	const pipePromise = source.pipe(destination);

	const destinationResult = await assertRejects(destination);
	const sourceResult = await source;

	assertLike(await assertRejects(pipePromise), {pipedFrom: [sourceResult]});
	assert.deepEqual(destinationResult.pipedFrom, [sourceResult]);
	assert.deepEqual(sourceResult.pipedFrom, []);
});

test('Returns pipedFrom on source + destination failure', async () => {
	const source = execa('noop-fail.js', ['1', foobarString]);
	const destination = execa('stdin-fail.js');
	const pipePromise = source.pipe(destination);

	const destinationResult = await assertRejects(destination);
	const sourceResult = await assertRejects(source);

	assertLike(await assertRejects(pipePromise), {pipedFrom: [sourceResult]});
	assert.deepEqual(destinationResult.pipedFrom, [sourceResult]);
	assert.deepEqual(sourceResult.pipedFrom, []);
});

test('Returns pipedFrom on deep failure', async () => {
	const source = execa('noop-fail.js', ['1', foobarString]);
	const destination = execa('stdin-fail.js');
	const secondDestination = execa('stdin.js');
	const pipePromise = source.pipe(destination);
	const secondPipePromise = pipePromise.pipe(secondDestination);

	const destinationResult = await assertRejects(destination);
	const secondDestinationResult = await secondDestination;
	assert.deepEqual(secondDestinationResult.pipedFrom, []);
	const sourceResult = await assertRejects(source);

	assertLike(await assertRejects(secondPipePromise), {pipedFrom: [sourceResult]});
	assert.deepEqual(secondDestinationResult.pipedFrom, [destinationResult]);
	assertLike(await assertRejects(pipePromise), {pipedFrom: [sourceResult]});
	assert.deepEqual(destinationResult.pipedFrom, [sourceResult]);
	assert.deepEqual(sourceResult.pipedFrom, []);
});

test('Returns pipedFrom from multiple sources', async () => {
	const source = execa('noop.js', [foobarString]);
	const secondSource = execa('noop.js', [foobarString]);
	const destination = execa('stdin.js');
	const pipePromise = source.pipe(destination);
	const secondPipePromise = secondSource.pipe(destination);

	const destinationResult = await destination;
	assert.deepEqual(destinationResult.pipedFrom, []);
	const sourceResult = await source;
	const secondSourceResult = await secondSource;

	assertLike(await pipePromise, {pipedFrom: [sourceResult, secondSourceResult]});
	assertLike(await secondPipePromise, {pipedFrom: [sourceResult, secondSourceResult]});
	assert.deepEqual(destinationResult.pipedFrom, [sourceResult, secondSourceResult]);
	assert.deepEqual(sourceResult.pipedFrom, []);
	assert.deepEqual(secondSourceResult.pipedFrom, []);
});

test('Returns pipedFrom from already ended subprocesses', async () => {
	const source = execa('noop.js', [foobarString]);
	const destination = execa('stdin.js');
	destination.stdin.end('.');
	await Promise.all([source, destination]);
	const pipePromise = source.pipe(destination);

	const destinationResult = await destination;
	assert.deepEqual(destinationResult.pipedFrom, []);
	const sourceResult = await source;
	assert.deepEqual(sourceResult.pipedFrom, []);

	assertLike(await pipePromise, {pipedFrom: [sourceResult]});
	assert.deepEqual(destinationResult.pipedFrom, [sourceResult]);
	assert.deepEqual(sourceResult.pipedFrom, []);
});

test('Does not return nor set pipedFrom on signal abort', async () => {
	const abortController = new AbortController();
	const source = execa('empty.js');
	const destination = execa('empty.js');
	const pipePromise = source.pipe(destination, {unpipeSignal: abortController.signal});

	abortController.abort();
	assertLike(await assertRejects(pipePromise), {pipedFrom: []});
	const destinationResult = await destination;
	assert.deepEqual(destinationResult.pipedFrom, []);
	const sourceResult = await source;
	assert.deepEqual(sourceResult.pipedFrom, []);
});

test('Can pipe same source to same destination twice', async () => {
	const source = execa('noop.js', [foobarString]);
	const destination = execa('stdin.js');
	const pipePromise = source.pipe(destination);
	const secondPipePromise = source.pipe(destination);

	const destinationResult = await destination;
	assertLike(destinationResult, {pipedFrom: []});
	const sourceResult = await source;
	assertLike(sourceResult, {pipedFrom: []});

	assertLike(await source, {stdout: foobarString});
	assertLike(await destination, {stdout: foobarString});
	assert.equal(await pipePromise, destinationResult);
	assert.equal(await secondPipePromise, destinationResult);
	assert.deepEqual(destinationResult.pipedFrom, [sourceResult]);
	assert.deepEqual(sourceResult.pipedFrom, []);
});

// `to: 'fd3'` and higher requires the `stdio` option, which cannot be combined with the `stdin` option that piping sets by default
test('Can pipe to an additional file descriptor of a destination with the "stdio" option', async () => {
	const source = execa('noop.js', [foobarString]);
	const {stdout} = await source.pipe('stdin-fd.js', ['3'], {
		to: 'fd3',
		stdio: ['pipe', 'pipe', 'pipe', {value: 'pipe', input: true}],
	});
	assert.equal(stdout, foobarString);
});
