import {once} from 'node:events';
import {PassThrough} from 'node:stream';
import test from 'ava';
import {execa} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString} from '../helpers/input.js';
import {assertMaxListeners} from '../helpers/listeners.js';
import {fullReadableStdio} from '../helpers/stdio.js';
import {PARALLEL_COUNT} from '../helpers/parallel.js';

setFixtureDirectory();

test('Can pipe two sources to same destination', async t => {
	const source = execa('noop.js', [foobarString]);
	const secondSource = execa('noop.js', [foobarString]);
	const destination = execa('stdin.js');
	const pipePromise = source.pipe(destination);
	const secondPipePromise = secondSource.pipe(destination);

	t.like(await source, {stdout: foobarString});
	t.like(await secondSource, {stdout: foobarString});
	t.like(await destination, {stdout: `${foobarString}\n${foobarString}`});
	t.is(await pipePromise, await destination);
	t.is(await secondPipePromise, await destination);
});

test('Can pipe three sources to same destination', async t => {
	const source = execa('noop.js', [foobarString]);
	const secondSource = execa('noop.js', [foobarString]);
	const thirdSource = execa('noop.js', [foobarString]);
	const destination = execa('stdin.js');
	const pipePromise = source.pipe(destination);
	const secondPipePromise = secondSource.pipe(destination);
	const thirdPromise = thirdSource.pipe(destination);

	t.like(await source, {stdout: foobarString});
	t.like(await secondSource, {stdout: foobarString});
	t.like(await thirdSource, {stdout: foobarString});
	t.like(await destination, {stdout: `${foobarString}\n${foobarString}\n${foobarString}`});
	t.is(await pipePromise, await destination);
	t.is(await secondPipePromise, await destination);
	t.is(await thirdPromise, await destination);
});

test.serial('Can pipe many sources to same destination', async t => {
	const checkMaxListeners = assertMaxListeners(t);

	const expectedResults = Array.from({length: PARALLEL_COUNT}, (_, index) => `${index}`).sort();
	const sources = expectedResults.map(expectedResult => execa('noop.js', [expectedResult]));
	const destination = execa('stdin.js');
	const pipePromises = sources.map(source => source.pipe(destination));

	const results = await Promise.all(sources);
	t.deepEqual(results.map(({stdout}) => stdout), expectedResults);
	const destinationResult = await destination;
	t.deepEqual(destinationResult.stdout.split('\n').sort(), expectedResults);
	t.deepEqual(await Promise.all(pipePromises), sources.map(() => destinationResult));

	checkMaxListeners();
});

test.serial('Can pipe same source to many destinations', async t => {
	const checkMaxListeners = assertMaxListeners(t);

	const source = execa('noop-fd.js', ['1', foobarString]);
	const expectedResults = Array.from({length: PARALLEL_COUNT}, (_, index) => `${index}`);
	const destinations = expectedResults.map(expectedResult => execa('noop-stdin-double.js', [expectedResult]));
	const pipePromises = destinations.map(destination => source.pipe(destination));

	t.like(await source, {stdout: foobarString});
	const results = await Promise.all(destinations);
	t.deepEqual(results.map(({stdout}) => stdout), expectedResults.map(result => `${foobarString} ${result}`));
	t.deepEqual(await Promise.all(pipePromises), results);

	checkMaxListeners();
});

test('Can pipe two streams from same subprocess to same destination', async t => {
	const source = execa('noop-both.js', [foobarString]);
	const destination = execa('stdin.js');
	const pipePromise = source.pipe(destination);
	const secondPipePromise = source.pipe(destination, {from: 'stderr'});

	t.like(await source, {stdout: foobarString, stderr: foobarString});
	t.like(await destination, {stdout: `${foobarString}\n${foobarString}`});
	t.is(await pipePromise, await destination);
	t.is(await secondPipePromise, await destination);
});

test('Can pipe same source to two streams from same subprocess', async t => {
	const source = execa('noop-fd.js', ['1', foobarString]);
	const destination = execa('stdin-fd-both.js', ['3'], fullReadableStdio());
	const pipePromise = source.pipe(destination);
	const secondPipePromise = source.pipe(destination, {to: 'fd3'});

	t.like(await source, {stdout: foobarString});
	t.like(await destination, {stdout: `${foobarString}${foobarString}`});
	t.is(await pipePromise, await destination);
	t.is(await secondPipePromise, await destination);
});

test('Can pipe a new source to same destination after some source has already written', async t => {
	const passThroughStream = new PassThrough();
	const source = execa('stdin.js', {stdin: ['pipe', passThroughStream]});
	const destination = execa('stdin.js');
	const pipePromise = source.pipe(destination);

	passThroughStream.write('foo');
	const firstWrite = await once(destination.stdout, 'data');
	t.is(firstWrite.toString(), 'foo');

	const secondSource = execa('noop.js', ['bar']);
	const secondPipePromise = secondSource.pipe(destination);
	passThroughStream.end();

	t.like(await source, {stdout: 'foo'});
	t.like(await secondSource, {stdout: 'bar'});
	t.like(await destination, {stdout: 'foobar'});
	t.is(await pipePromise, await destination);
	t.is(await secondPipePromise, await destination);
});

test('Can pipe a second source to same destination after destination has already ended', async t => {
	const source = execa('noop.js', [foobarString]);
	const destination = execa('stdin.js');
	const pipePromise = source.pipe(destination);

	t.like(await source, {stdout: foobarString});
	t.like(await destination, {stdout: foobarString});
	t.is(await pipePromise, await destination);

	const secondSource = execa('noop.js', [foobarString]);
	const secondPipePromise = secondSource.pipe(destination);

	t.like(await secondSource, {stdout: ''});
	t.is(await secondPipePromise, await destination);
});

test('Can pipe same source to a second destination after source has already ended', async t => {
	const source = execa('noop.js', [foobarString]);
	const destination = execa('stdin.js');
	const pipePromise = source.pipe(destination);

	t.like(await source, {stdout: foobarString});
	t.like(await destination, {stdout: foobarString});
	t.is(await pipePromise, await destination);

	const secondDestination = execa('stdin.js');
	const secondPipePromise = source.pipe(secondDestination);

	t.like(await secondDestination, {stdout: ''});
	t.is(await secondPipePromise, await secondDestination);
});

test('Can pipe a new source to same destination after some but not all sources have ended', async t => {
	const source = execa('noop.js', [foobarString]);
	const passThroughStream = new PassThrough();
	const secondSource = execa('stdin.js', {stdin: ['pipe', passThroughStream]});
	const destination = execa('stdin.js');
	const pipePromise = source.pipe(destination);
	const secondPipePromise = secondSource.pipe(destination);

	t.like(await source, {stdout: foobarString});

	const thirdSource = execa('noop.js', [foobarString]);
	const thirdPipePromise = thirdSource.pipe(destination);
	passThroughStream.end(`${foobarString}\n`);

	t.like(await secondSource, {stdout: foobarString});
	t.like(await thirdSource, {stdout: foobarString});
	t.like(await destination, {stdout: `${foobarString}\n${foobarString}\n${foobarString}`});
	t.is(await pipePromise, await destination);
	t.is(await secondPipePromise, await destination);
	t.is(await thirdPipePromise, await destination);
});

test('Can pipe two subprocesses already ended', async t => {
	const source = execa('noop.js', [foobarString]);
	const destination = execa('stdin.js');
	destination.stdin.end('.');
	await Promise.all([source, destination]);
	const pipePromise = source.pipe(destination);

	t.like(await source, {stdout: foobarString});
	t.like(await destination, {stdout: '.'});
	t.is(await pipePromise, await destination);
});

test('Can pipe to same destination through multiple paths', async t => {
	const source = execa('noop.js', [foobarString]);
	const destination = execa('stdin.js');
	const secondDestination = execa('stdin.js');
	const pipePromise = source.pipe(destination);
	const secondPipePromise = pipePromise.pipe(secondDestination);
	const thirdPipePromise = source.pipe(secondDestination);

	t.like(await source, {stdout: foobarString});
	t.like(await destination, {stdout: foobarString});
	t.like(await secondDestination, {stdout: `${foobarString}\n${foobarString}`});
	t.is(await pipePromise, await destination);
	t.is(await secondPipePromise, await secondDestination);
	t.is(await thirdPipePromise, await secondDestination);
});

test('Can pipe two sources to same destination in objectMode', async t => {
	const stdoutTransform = {
		* transform() {
			yield [foobarString];
		},
		objectMode: true,
	};
	const source = execa('noop.js', [''], {stdout: stdoutTransform});
	const secondSource = execa('noop.js', [''], {stdout: stdoutTransform});
	t.true(source.stdout.readableObjectMode);
	t.true(secondSource.stdout.readableObjectMode);

	const stdinTransform = {
		* transform([chunk]) {
			yield chunk;
		},
		objectMode: true,
	};
	const destination = execa('stdin.js', {stdin: stdinTransform});
	const pipePromise = source.pipe(destination);
	const secondPipePromise = secondSource.pipe(destination);

	t.like(await source, {stdout: [[foobarString]]});
	t.like(await secondSource, {stdout: [[foobarString]]});
	t.like(await destination, {stdout: `${foobarString}\n${foobarString}`});
	t.is(await pipePromise, await destination);
	t.is(await secondPipePromise, await destination);
});

test('Can pipe one source to two destinations', async t => {
	const source = execa('noop.js', [foobarString]);
	const destination = execa('stdin.js');
	const secondDestination = execa('stdin.js');
	const pipePromise = source.pipe(destination);
	const secondPipePromise = source.pipe(secondDestination);

	t.like(await source, {stdout: foobarString});
	t.like(await destination, {stdout: foobarString});
	t.like(await secondDestination, {stdout: foobarString});
	t.is(await pipePromise, await destination);
	t.is(await secondPipePromise, await secondDestination);
});

test('Can pipe one source to three destinations', async t => {
	const source = execa('noop.js', [foobarString]);
	const destination = execa('stdin.js');
	const secondDestination = execa('stdin.js');
	const thirdDestination = execa('stdin.js');
	const pipePromise = source.pipe(destination);
	const secondPipePromise = source.pipe(secondDestination);
	const thirdPipePromise = source.pipe(thirdDestination);

	t.like(await source, {stdout: foobarString});
	t.like(await destination, {stdout: foobarString});
	t.like(await secondDestination, {stdout: foobarString});
	t.like(await thirdDestination, {stdout: foobarString});
	t.is(await pipePromise, await destination);
	t.is(await secondPipePromise, await secondDestination);
	t.is(await thirdPipePromise, await thirdDestination);
});

test('Can create a series of pipes', async t => {
	const source = execa('noop.js', [foobarString]);
	const destination = execa('stdin.js');
	const secondDestination = execa('stdin.js');
	const pipePromise = source.pipe(destination);
	const secondPipePromise = pipePromise.pipe(secondDestination);

	t.like(await source, {stdout: foobarString});
	t.like(await destination, {stdout: foobarString});
	t.like(await secondDestination, {stdout: foobarString});
	t.is(await pipePromise, await destination);
	t.is(await secondPipePromise, await secondDestination);
});

test('Returns pipedFrom on success', async t => {
	const source = execa('noop.js', [foobarString]);
	const destination = execa('stdin.js');
	const pipePromise = source.pipe(destination);

	const destinationResult = await destination;
	t.deepEqual(destinationResult.pipedFrom, []);
	const sourceResult = await source;

	t.like(await pipePromise, {pipedFrom: [sourceResult]});
	t.deepEqual(destinationResult.pipedFrom, [sourceResult]);
	t.deepEqual(sourceResult.pipedFrom, []);
});

test('Returns pipedFrom on deep success', async t => {
	const source = execa('noop.js', [foobarString]);
	const destination = execa('stdin.js');
	const secondDestination = execa('stdin.js');
	const pipePromise = source.pipe(destination);
	const secondPipePromise = pipePromise.pipe(secondDestination);

	const destinationResult = await destination;
	t.deepEqual(destinationResult.pipedFrom, []);
	const secondDestinationResult = await secondDestination;
	t.deepEqual(secondDestinationResult.pipedFrom, []);
	const sourceResult = await source;

	t.like(await secondPipePromise, {pipedFrom: [destinationResult]});
	t.deepEqual(secondDestinationResult.pipedFrom, [destinationResult]);
	t.like(await pipePromise, {pipedFrom: [sourceResult]});
	t.deepEqual(destinationResult.pipedFrom, [sourceResult]);
	t.deepEqual(sourceResult.pipedFrom, []);
});

test('Returns pipedFrom on source failure', async t => {
	const source = execa('noop-fail.js', ['1', foobarString]);
	const destination = execa('stdin.js');
	const pipePromise = source.pipe(destination);

	const destinationResult = await destination;
	t.deepEqual(destinationResult.pipedFrom, []);
	const sourceResult = await t.throwsAsync(source);

	t.like(await t.throwsAsync(pipePromise), {pipedFrom: []});
	t.deepEqual(destinationResult.pipedFrom, [sourceResult]);
	t.deepEqual(sourceResult.pipedFrom, []);
});

test('Returns pipedFrom on destination failure', async t => {
	const source = execa('noop.js', [foobarString]);
	const destination = execa('stdin-fail.js');
	const pipePromise = source.pipe(destination);

	const destinationResult = await t.throwsAsync(destination);
	const sourceResult = await source;

	t.like(await t.throwsAsync(pipePromise), {pipedFrom: [sourceResult]});
	t.deepEqual(destinationResult.pipedFrom, [sourceResult]);
	t.deepEqual(sourceResult.pipedFrom, []);
});

test('Returns pipedFrom on source + destination failure', async t => {
	const source = execa('noop-fail.js', ['1', foobarString]);
	const destination = execa('stdin-fail.js');
	const pipePromise = source.pipe(destination);

	const destinationResult = await t.throwsAsync(destination);
	const sourceResult = await t.throwsAsync(source);

	t.like(await t.throwsAsync(pipePromise), {pipedFrom: [sourceResult]});
	t.deepEqual(destinationResult.pipedFrom, [sourceResult]);
	t.deepEqual(sourceResult.pipedFrom, []);
});

test('Returns pipedFrom on deep failure', async t => {
	const source = execa('noop-fail.js', ['1', foobarString]);
	const destination = execa('stdin-fail.js');
	const secondDestination = execa('stdin.js');
	const pipePromise = source.pipe(destination);
	const secondPipePromise = pipePromise.pipe(secondDestination);

	const destinationResult = await t.throwsAsync(destination);
	const secondDestinationResult = await secondDestination;
	t.deepEqual(secondDestinationResult.pipedFrom, []);
	const sourceResult = await t.throwsAsync(source);

	t.like(await t.throwsAsync(secondPipePromise), {pipedFrom: [sourceResult]});
	t.deepEqual(secondDestinationResult.pipedFrom, [destinationResult]);
	t.like(await t.throwsAsync(pipePromise), {pipedFrom: [sourceResult]});
	t.deepEqual(destinationResult.pipedFrom, [sourceResult]);
	t.deepEqual(sourceResult.pipedFrom, []);
});

test('Returns pipedFrom from multiple sources', async t => {
	const source = execa('noop.js', [foobarString]);
	const secondSource = execa('noop.js', [foobarString]);
	const destination = execa('stdin.js');
	const pipePromise = source.pipe(destination);
	const secondPipePromise = secondSource.pipe(destination);

	const destinationResult = await destination;
	t.deepEqual(destinationResult.pipedFrom, []);
	const sourceResult = await source;
	const secondSourceResult = await secondSource;

	t.like(await pipePromise, {pipedFrom: [sourceResult, secondSourceResult]});
	t.like(await secondPipePromise, {pipedFrom: [sourceResult, secondSourceResult]});
	t.deepEqual(destinationResult.pipedFrom, [sourceResult, secondSourceResult]);
	t.deepEqual(sourceResult.pipedFrom, []);
	t.deepEqual(secondSourceResult.pipedFrom, []);
});

test('Returns pipedFrom from already ended subprocesses', async t => {
	const source = execa('noop.js', [foobarString]);
	const destination = execa('stdin.js');
	destination.stdin.end('.');
	await Promise.all([source, destination]);
	const pipePromise = source.pipe(destination);

	const destinationResult = await destination;
	t.deepEqual(destinationResult.pipedFrom, []);
	const sourceResult = await source;
	t.deepEqual(sourceResult.pipedFrom, []);

	t.like(await pipePromise, {pipedFrom: [sourceResult]});
	t.deepEqual(destinationResult.pipedFrom, [sourceResult]);
	t.deepEqual(sourceResult.pipedFrom, []);
});

test('Does not return nor set pipedFrom on signal abort', async t => {
	const abortController = new AbortController();
	const source = execa('empty.js');
	const destination = execa('empty.js');
	const pipePromise = source.pipe(destination, {unpipeSignal: abortController.signal});

	abortController.abort();
	t.like(await t.throwsAsync(pipePromise), {pipedFrom: []});
	const destinationResult = await destination;
	t.deepEqual(destinationResult.pipedFrom, []);
	const sourceResult = await source;
	t.deepEqual(sourceResult.pipedFrom, []);
});

test('Can pipe same source to same destination twice', async t => {
	const source = execa('noop.js', [foobarString]);
	const destination = execa('stdin.js');
	const pipePromise = source.pipe(destination);
	const secondPipePromise = source.pipe(destination);

	const destinationResult = await destination;
	t.like(destinationResult, {pipedFrom: []});
	const sourceResult = await source;
	t.like(sourceResult, {pipedFrom: []});

	t.like(await source, {stdout: foobarString});
	t.like(await destination, {stdout: foobarString});
	t.is(await pipePromise, destinationResult);
	t.is(await secondPipePromise, destinationResult);
	t.deepEqual(destinationResult.pipedFrom, [sourceResult]);
	t.deepEqual(sourceResult.pipedFrom, []);
});
