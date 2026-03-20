import { execa } from 'execa';
import { Transform } from 'node:stream';

/**
 * Stream processing with transforms
 * Demonstrates filtering and transforming command output
 */

/**
 * Filter lines containing specific keywords
 */
function createKeywordFilter(keywords) {
	return new Transform({
		transform(chunk, encoding, callback) {
			const lines = chunk.toString().split('\n');
			const filtered = lines
				.filter(line => keywords.some(kw => line.toLowerCase().includes(kw.toLowerCase())))
				.join('\n');
			callback(null, filtered ? filtered + '\n' : '');
		},
	});
}

/**
 * Prefix each line with a timestamp
 */
function createTimestampPrefix() {
	return new Transform({
		transform(chunk, encoding, callback) {
			const lines = chunk.toString().split('\n');
			const prefixed = lines
				.filter(line => line.trim())
				.map(line => `[${new Date().toISOString()}] ${line}`)
				.join('\n');
			callback(null, prefixed + '\n');
		},
	});
}

/**
 * Count lines and show progress
 */
function createProgressCounter() {
	let count = 0;
	return new Transform({
		transform(chunk, encoding, callback) {
			const lines = chunk.toString().split('\n');
			const nonEmpty = lines.filter(line => line.trim());
			count += nonEmpty.length;
			process.stdout.write(`\r📊 Processed ${count} lines...`);
			callback(null, chunk);
		},
		flush(callback) {
			console.log(`\n✅ Total: ${count} lines`);
			callback();
		},
	});
}

/**
 * Run a command and process its output through transforms
 */
async function runWithTransforms(command, args, transforms) {
	const subprocess = execa(command, args);

	let stream = subprocess.stdout;
	for (const transform of transforms) {
		stream = stream.pipe(transform);
	}

	stream.pipe(process.stdout);
	await subprocess;
}

// Demo
if (import.meta.url === `file://${process.argv[1]}`) {
	console.log('🔍 Running npm audit with filtered output:\n');
	
	try {
		await runWithTransforms(
			'npm',
			['audit', '--json'],
			[createKeywordFilter(['severity', 'critical', 'high'])]
		);
	} catch {
		// npm audit exits with non-zero on vulnerabilities
	}
}

export {
	createKeywordFilter,
	createTimestampPrefix,
	createProgressCounter,
	runWithTransforms,
};
